// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Expects 'Bearer TOKEN'

    try {
      const decodedToken = jwt.decode(token);

      if (decodedToken) {
        // Extract access role (e.g., 'admin', 'user')
        const accessRoles = decodedToken.realm_access?.roles || [];
        req.accessRole = accessRoles.find(role => ['admin', 'user'].includes(role));

        // Extract tenant role (e.g., 'tenant_xyz')
        req.tenantRole = accessRoles.find(role => role.startsWith('tenant_'));
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      // Optionally, you could send an error response here,
      // but for now, we'll just log and proceed without roles.
    }
  }
  next(); // Proceed to the next middleware/route handler
};

export default authMiddleware;