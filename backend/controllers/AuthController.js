import authService from '../services/AuthService.js';

export class AuthController {
  async signupCustomer(req, res, next) {
    try {
      const result = await authService.signupCustomer(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async signupSeller(req, res, next) {
    try {
      const result = await authService.signupSeller(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async loginCustomer(req, res, next) {
    try {
      const result = await authService.loginCustomer(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async loginSeller(req, res, next) {
    try {
      const result = await authService.loginSeller(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
