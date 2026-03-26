import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import { User } from '../model/user.model';
import config from '../config';


// Register user
const register = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate required fields
    if (!email || !req.body.password || !req.body.name || !req.body.role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required',
      });
    }

    // Check if user already exists
    const isUserExist = await User.findOne({ email });

    if (isUserExist) {
      return res.status(400).json({
        success: false,
        message: 'User already exists!',
      });
    }

    const savedUser = await User.create(req.body);

    // Generate token
    const token = jwt.sign(
      { email: savedUser.email, role: savedUser.role },
      config.jwt_secret as Secret,
      { expiresIn: config.jwt_expires_in as any }
    );

    // Omit password from response
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResponse,
      token,
    });
  } catch (err: any) {
    console.error('Register Error:', err);

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    });
  }
};

// Login user
const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, user.password as string);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = jwt.sign(
      { email: user.email, role: user.role },
      config.jwt_secret as Secret,
      { expiresIn: config.jwt_expires_in as any }
    );

    // Omit password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      token,
      user: userResponse,
    });
  } catch (err: any) {
    console.error('Login Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    });
  }
};


// Get all users
const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: users,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: err.message,
    });
  }
};


// get single user
const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }
    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    })
  }
}

// get update user
const updateUser = async (req: Request, res: Response) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, runValidators: true
      }
    )
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    })
  }
}

//Update user role (admin / student)
const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: updatedUser,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update role",
      error: error.message,
    });
  }
};
const socialLogin = async (req: Request, res: Response) => {
  try {
    const { name, email, image, credential } = req.body;

    // If credential (Google JWT) is provided, decode it
    let userData: any = { name, email, image };
    
    if (credential) {
      try {
        // Decode Google JWT without verification (we trust Google)
        const decoded = jwt.decode(credential) as any;
        if (decoded) {
          userData = {
            name: decoded.name || name || 'User',
            email: decoded.email || email,
            image: decoded.picture || image,
          };
        }
      } catch (decodeErr) {
        console.error('Failed to decode Google credential:', decodeErr);
        // Fall back to provided data
      }
    }

    let user = await User.findOne({ email: userData.email });

    // If user doesn't exist → create
    if (!user) {
      user = await User.create({
        name: userData.name,
        email: userData.email,
        image: userData.image,
        password: "SOCIAL_LOGIN_" + Date.now(), // unique dummy password
        role: 'student',
      });
    } else {
      // Update existing user's image if provided
      if (userData.image) {
        user.image = userData.image;
        await user.save();
      }
    }

    // Generate JWT (your system)
    const token = jwt.sign(
      { email: user.email, role: user.role },
      config.jwt_secret as Secret,
      { expiresIn: config.jwt_expires_in as any }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Social login successful",
      token,
      user: userResponse,
    });

  } catch (error: any) {
    console.error('Social login error:', error);
    res.status(500).json({
      success: false,
      message: "Social login failed",
      error: error.message,
    });
  }
};

export const userControllers = {
  register,
  login,
  getUsers,
  getUser,
  updateUser,
  updateUserRole,
  socialLogin,
};