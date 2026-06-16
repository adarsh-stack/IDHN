'use server';

import { connectToDatabase } from '../lib/db';
import bcrypt from 'bcryptjs';

interface ActionResponse {
  success: boolean;
  message: string;
  user?: {
    name: string;
    initials: string;
    role: string;
  };
}

export async function handleLogin(formData: FormData): Promise<ActionResponse> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, message: 'Please provide complete credentials.' };
  }

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (!user) {
      return { success: false, message: 'Invalid email or password.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid email or password.' };
    }

    const nameParts: string[] = user.name.split(' ');
    const initials = nameParts.map((part) => part[0]).join('').toUpperCase().substring(0, 2);

    await db.collection('audit_logs').insertOne({
      action: 'USER_LOGIN_SUCCESS',
      userEmail: user.email,
      role: user.role || 'Staff',
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'Authenticated successfully.',
      user: {
        name: user.name,
        initials: initials || 'US',
        role: user.role || 'Staff',
      },
    };
  } catch (error) {
    console.error('Database Login System Exception:', error);
    return { success: false, message: 'Local driver authentication failed.' };
  }
}

export async function handleRegister(formData: FormData): Promise<ActionResponse> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string || 'Staff';

  if (!name || !email || !password) {
    return { success: false, message: 'Please provide full registration details.' };
  }

  try {
    const { db } = await connectToDatabase();
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return { success: false, message: 'This email is already registered in the IDHN network.' };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.collection('users').insertOne({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role,
      createdAt: new Date(),
    });

    await db.collection('audit_logs').insertOne({
      action: 'STAFF_REGISTRATION_SUCCESS',
      registeredEmail: email.toLowerCase(),
      assignedRole: role,
      timestamp: new Date(),
    });

    return { success: true, message: 'Registration successful! Proceeding to login...' };
  } catch (error) {
    console.error('Database Registration Exception:', error);
    return { success: false, message: 'Cluster database registration write failed.' };
  }
}