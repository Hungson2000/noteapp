const { validationResult, body } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

const rules = {
  register: [
    body('username').trim().notEmpty().withMessage('Username không được để trống').isLength({ min: 2, max: 30 }).withMessage('Username từ 2-30 ký tự'),
    body('email').trim().notEmpty().withMessage('Email không được để trống').isEmail().withMessage('Email không đúng định dạng').normalizeEmail(),
    body('password').notEmpty().withMessage('Password không được để trống').isLength({ min: 6 }).withMessage('Password tối thiểu 6 ký tự')
  ],
  login: [
    body('email').trim().notEmpty().withMessage('Email không được để trống').isEmail().withMessage('Email không đúng định dạng'),
    body('password').notEmpty().withMessage('Password không được để trống')
  ],
  changePassword: [
    body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại không được để trống'),
    body('newPassword').notEmpty().withMessage('Mật khẩu mới không được để trống').isLength({ min: 6 }).withMessage('Mật khẩu mới tối thiểu 6 ký tự')
  ],
  createNote: [
    body('title').trim().notEmpty().withMessage('Tiêu đề không được để trống').isLength({ max: 200 }).withMessage('Tiêu đề tối đa 200 ký tự'),
    body('content').optional().isLength({ max: 50000 }).withMessage('Nội dung quá dài'),
    body('tags').optional().isArray().withMessage('Tags phải là mảng')
  ],
  forgotPassword: [
    body('email').trim().notEmpty().withMessage('Email không được để trống').isEmail().withMessage('Email không đúng định dạng')
  ],
  resetPassword: [
    body('token').notEmpty().withMessage('Token không hợp lệ'),
    body('newPassword').notEmpty().withMessage('Mật khẩu không được để trống').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự')
  ]
};

module.exports = { validate, rules };
