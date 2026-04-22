function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Utilizador não autenticado' });
  }

  const cargo = String(req.user.cargo || '').toLowerCase();

  if (cargo !== 'admin') {
    return res.status(403).json({ error: 'Acesso apenas para administradores' });
  }

  next();
}

module.exports = adminMiddleware;
