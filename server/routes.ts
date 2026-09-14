import express, { Request, Response, NextFunction } from 'express';
import {
  authenticateWithPin,
  verifySessionToken,
  validatePinPolicy,
  hashPin,
  localProfilesStore,
  localCredentialsStore,
  SessionPayload,
} from './auth';
import {
  getUserProfile,
  listUserProfiles,
  saveUserProfile,
  saveUserCredential,
  deactivateUserProfile,
  deleteUserCredential,
  logSecurityEvent,
  ServerUserRecord,
  ServerUserCredential,
} from './db';

export const apiRouter = express.Router();

// Middleware: Authenticate Session Token
export interface AuthenticatedRequest extends Request {
  sessionUser?: SessionPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Session non authentifiée. Veuillez vous reconnecter.' });
    return;
  }

  const token = authHeader.substring(7);
  const session = verifySessionToken(token);
  if (!session) {
    res.status(401).json({ success: false, error: 'Session expirée ou invalide. Veuillez vous reconnecter.' });
    return;
  }

  req.sessionUser = session;
  next();
}

// Middleware: Require ADMIN Role
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.sessionUser?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Accès refusé. Privilèges Administrateur requis.' });
      return;
    }
    next();
  });
}

// ----------------------------------------------------
// Authentication Endpoints
// ----------------------------------------------------

// POST /api/auth/pin-login
apiRouter.post('/auth/pin-login', async (req: Request, res: Response) => {
  try {
    const { userId, pin } = req.body || {};
    if (!userId || !pin) {
      res.status(400).json({ success: false, error: 'Identifiant utilisateur et code PIN requis.' });
      return;
    }

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const result = await authenticateWithPin(String(userId).trim(), String(pin).trim(), ip);

    res.status(result.statusCode || 200).json(result);
  } catch (err: any) {
    console.error('Unhandled error in /api/auth/pin-login:', err);
    res.status(500).json({ success: false, error: 'Erreur interne du serveur lors de la vérification.' });
  }
});

// GET /api/auth/session
apiRouter.get('/auth/session', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.sessionUser!.userId;
  let profile = await getUserProfile(userId);
  if (!profile) {
    profile = localProfilesStore.get(userId) || null;
  }

  if (!profile || profile.active === false) {
    res.status(401).json({ valid: false, error: 'Utilisateur inactif ou introuvable.' });
    return;
  }

  res.json({ valid: true, user: profile });
});

// POST /api/auth/logout
apiRouter.post('/auth/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Déconnexion réussie.' });
});

// ----------------------------------------------------
// Admin User Management Endpoints (Strictly Protected)
// ----------------------------------------------------

// GET /api/admin/users - List all users (clean, without PIN or pinHash)
apiRouter.get('/admin/users', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    let users = await listUserProfiles();
    if (!users || users.length === 0) {
      users = Array.from(localProfilesStore.values());
    }

    // Double-check to never expose any sensitive fields
    const safeUsers = users.map(u => {
      const { ...safe } = u as any;
      delete safe.pinCode;
      delete safe.pinHash;
      return safe;
    });

    res.json({ success: true, users: safeUsers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
  }
});

// POST /api/admin/users - Create new user with server-side PIN hashing
apiRouter.post('/admin/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, phone, role, pin, agencyId, jobTitle, avatarUrl, active } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, error: 'Le nom est obligatoire.' });
      return;
    }

    const pinValidation = validatePinPolicy(pin);
    if (!pinValidation.valid) {
      res.status(400).json({ success: false, error: pinValidation.error });
      return;
    }

    // Generate new user ID
    const newId = `u-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const { pinHash, salt } = await hashPin(pin);

    const newProfile: ServerUserRecord = {
      id: newId,
      name: name.trim(),
      email: email?.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@autofleet.fr`,
      phone: phone?.trim() || '+33 6 00 00 00 00',
      role: role || 'AGENT_COMPTOIR',
      agencyId: agencyId || 'agency-paris-orly',
      jobTitle: jobTitle?.trim() || 'Collaborateur',
      avatarUrl: avatarUrl?.trim() || undefined,
      active: active !== false,
      pinConfigured: true,
      createdAt: new Date().toISOString(),
    };

    const newCred: ServerUserCredential = {
      userId: newId,
      pinHash,
      salt,
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date().toISOString(),
    };

    // Save to memory stores
    localProfilesStore.set(newId, newProfile);
    localCredentialsStore.set(newId, newCred);

    // Save to Firestore
    await saveUserProfile(newProfile);
    await saveUserCredential(newCred);

    await logSecurityEvent(
      req.sessionUser!.userId,
      'ADMIN_CREATE_USER',
      `Admin created user ${newId} (${newProfile.name}, role: ${newProfile.role})`
    );

    // Return safe user profile (without PIN or hash)
    res.status(201).json({ success: true, user: newProfile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Erreur lors de la création.' });
  }
});

// PUT /api/admin/users/:userId - Update user profile details
apiRouter.put('/admin/users/:userId', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, email, phone, role, jobTitle, avatarUrl, active } = req.body || {};

    let existing = await getUserProfile(userId);
    if (!existing) {
      existing = localProfilesStore.get(userId) || null;
    }

    if (!existing) {
      res.status(404).json({ success: false, error: 'Utilisateur non trouvé.' });
      return;
    }

    // Prevent demoting the only admin if self-updating
    if (existing.id === req.sessionUser!.userId && role && role !== 'ADMIN') {
      res.status(400).json({ success: false, error: 'Vous ne pouvez pas révoquer vos propres droits Administrateur.' });
      return;
    }

    const updatedProfile: ServerUserRecord = {
      ...existing,
      name: name !== undefined ? String(name).trim() : existing.name,
      email: email !== undefined ? String(email).trim() : existing.email,
      phone: phone !== undefined ? String(phone).trim() : existing.phone,
      role: role !== undefined ? role : existing.role,
      jobTitle: jobTitle !== undefined ? String(jobTitle).trim() : existing.jobTitle,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : existing.avatarUrl,
      active: active !== undefined ? Boolean(active) : existing.active,
      updatedAt: new Date().toISOString(),
    };

    localProfilesStore.set(userId, updatedProfile);
    await saveUserProfile(updatedProfile);

    await logSecurityEvent(
      req.sessionUser!.userId,
      'ADMIN_UPDATE_USER',
      `Admin updated user ${userId} (${updatedProfile.name}, role: ${updatedProfile.role})`
    );

    res.json({ success: true, user: updatedProfile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Erreur lors de la mise à jour.' });
  }
});

// POST /api/admin/users/:userId/reset-pin - Secure PIN reset by Admin
apiRouter.post('/admin/users/:userId/reset-pin', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { newPin } = req.body || {};

    const pinValidation = validatePinPolicy(newPin);
    if (!pinValidation.valid) {
      res.status(400).json({ success: false, error: pinValidation.error });
      return;
    }

    const { pinHash, salt } = await hashPin(newPin);

    const cred: ServerUserCredential = {
      userId,
      pinHash,
      salt,
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date().toISOString(),
    };

    localCredentialsStore.set(userId, cred);
    await saveUserCredential(cred);

    // Ensure user profile has pinConfigured: true
    let user = await getUserProfile(userId);
    if (!user) user = localProfilesStore.get(userId) || null;
    if (user) {
      user.pinConfigured = true;
      localProfilesStore.set(userId, user);
      await saveUserProfile(user);
    }

    await logSecurityEvent(
      req.sessionUser!.userId,
      'ADMIN_RESET_PIN',
      `Admin reset PIN for user ${userId}`
    );

    res.json({ success: true, message: 'Le code PIN a été mis à jour avec succès.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Erreur lors de la réinitialisation du PIN.' });
  }
});

// DELETE /api/admin/users/:userId - Deactivate / Delete user
apiRouter.delete('/admin/users/:userId', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Prevent admin deleting themselves
    if (userId === req.sessionUser!.userId) {
      res.status(400).json({ success: false, error: 'Vous ne pouvez pas supprimer votre propre compte.' });
      return;
    }

    localProfilesStore.delete(userId);
    localCredentialsStore.delete(userId);

    await deactivateUserProfile(userId);
    await deleteUserCredential(userId);

    await logSecurityEvent(
      req.sessionUser!.userId,
      'ADMIN_DELETE_USER',
      `Admin deactivated/deleted user ${userId}`
    );

    res.json({ success: true, message: 'Utilisateur supprimé/désactivé avec succès.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Erreur lors de la suppression.' });
  }
});

// GET /api/health
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});
