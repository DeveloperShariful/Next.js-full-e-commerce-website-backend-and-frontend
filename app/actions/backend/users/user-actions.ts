// File: app/actions/admin/users/user-actions.ts

'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Role, AddressType, Prisma } from '@prisma/client';
import { sendNotification } from '@/app/api/email/send-notification';
import bcrypt from "bcryptjs"; 
import { nanoid } from 'nanoid'; // ✅ To generate affiliate slug

// Helper function to extract address data from FormData
const extractAddress = (prefix: 'billing_' | 'shipping_', formData: FormData) => {
  return {
    firstName: (formData.get(`${prefix}firstName`) as string) || '',
    lastName: (formData.get(`${prefix}lastName`) as string) || '',
    company: (formData.get(`${prefix}company`) as string) || '',
    address1: (formData.get(`${prefix}address1`) as string) || '',
    address2: (formData.get(`${prefix}address2`) as string) || '',
    city: (formData.get(`${prefix}city`) as string) || '',
    state: (formData.get(`${prefix}state`) as string) || '',
    postcode: (formData.get(`${prefix}postcode`) as string) || '',
    country: (formData.get(`${prefix}country`) as string) || 'AU',
    phone: (formData.get(`${prefix}phone`) as string) || '',
    email: prefix === 'billing_' ? ((formData.get(`${prefix}email`) as string) || null) : null,
  };
};

type AddressData = ReturnType<typeof extractAddress>;

async function saveAddress(userId: string, type: AddressType, addressData: AddressData) {
  const existingAddress = await db.address.findFirst({
    where: { userId, type }
  });

  if (existingAddress) {
    await db.address.update({
      where: { id: existingAddress.id },
      data: addressData
    });
  } else {
    if (addressData.firstName || addressData.address1 || addressData.city) {
      await db.address.create({
        data: { userId, type, ...addressData }
      });
    }
  }
}

// ✅ HELPER: Auto-Create Affiliate Account if Role is AFFILIATE
async function ensureAffiliateAccount(userId: string, role: string, userName: string) {
  if (role === 'AFFILIATE') {
    const existing = await db.affiliateAccount.findUnique({ where: { userId } });
    if (!existing) {
      const baseSlug = (userName || "partner").toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniqueSlug = `${baseSlug}-${nanoid(4)}`;
      
      await db.affiliateAccount.create({
        data: {
          userId: userId,
          slug: uniqueSlug,
          status: "ACTIVE", // Auto-approved because created by Admin
        }
      });
    }
  }
}

// ============================================================================
// 1. CREATE NEW USER
// ============================================================================
export async function createUser(formData: FormData) {
  const email = formData.get('email') as string;
  const role = formData.get('role') as Role;
  const password = formData.get('password') as string; 
  
  const name = formData.get('name') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const nickname = formData.get('nickname') as string;
  const website = formData.get('website') as string;
  const bio = formData.get('bio') as string;
  const image = formData.get('image') as string;

  if (!email) {
    return { success: false, message: 'Email is required.' };
  }

  try {
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return { success: false, message: 'A user with this email already exists.' };
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const metafields = {
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      nickname: nickname?.trim() || name?.trim(),
      website: website?.trim()
    };

    const finalName = name?.trim() || nickname?.trim() || "Customer";

    const newUser = await db.user.create({
      data: {
        name: finalName,
        email: email.toLowerCase().trim(),
        role: role || 'CUSTOMER',
        password: hashedPassword,
        notes: bio?.trim(), 
        image: image || null, 
        metafields: metafields, 
        isActive: true
      }
    });

    // Auto-create wallet for every new user
    await db.wallet.upsert({
      where: { userId: newUser.id },
      create: { userId: newUser.id, balance: 0, points: 0 },
      update: {},
    });

    // ✅ Sync with Affiliate Hub if role is AFFILIATE
    await ensureAffiliateAccount(newUser.id, role, finalName);

    // Extract and Save Addresses
    const billingData = extractAddress('billing_', formData);
    const shippingData = extractAddress('shipping_', formData);

    await saveAddress(newUser.id, AddressType.BILLING, billingData);
    await saveAddress(newUser.id, AddressType.SHIPPING, shippingData);
    
    revalidatePath('/admin/users');
    revalidatePath('/admin/affiliate'); // Also refresh affiliate dashboard
    return { success: true, message: 'New user added successfully.' };
  } catch (error: unknown) {
    console.error('Create user failed:', error);
    return { success: false, message: 'Failed to create user. Please try again.' };
  }
}

// ============================================================================
// 2. UPDATE EXISTING USER
// ============================================================================
export async function updateUser(formData: FormData) {
  const id = formData.get('id') as string;
  const email = formData.get('email') as string;
  const role = formData.get('role') as Role;
  const password = formData.get('password') as string;

  const name = formData.get('name') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const nickname = formData.get('nickname') as string;
  const website = formData.get('website') as string;
  const bio = formData.get('bio') as string;
  const image = formData.get('image') as string;

  if (!id || !email) {
    return { success: false, message: 'User ID and Email are required.' };
  }

  try {
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser && existingUser.id !== id) {
      return { success: false, message: 'Another user is already using this email.' };
    }

    const existingMetafields = existingUser?.metafields && typeof existingUser.metafields === 'object' 
        ? existingUser.metafields 
        : {};

    const updatedMetafields = {
        ...existingMetafields,
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        nickname: nickname?.trim(),
        website: website?.trim()
    };

    const finalName = name?.trim() || nickname?.trim() || "Customer";

    const hashedPassword = password && password.trim() !== '' ? await bcrypt.hash(password, 10) : undefined;

    await db.user.update({
      where: { id },
      data: {
        name: finalName,
        email: email.toLowerCase().trim(),
        role: role,
        notes: bio?.trim(),
        metafields: updatedMetafields as unknown as Prisma.InputJsonValue,
        image: image !== undefined ? (image || null) : undefined,
        password: hashedPassword,
      }
    });

    // ✅ Sync with Affiliate Hub if role was changed to AFFILIATE
    await ensureAffiliateAccount(id, role, finalName);

    // Extract and Save Addresses for existing user
    const billingData = extractAddress('billing_', formData);
    const shippingData = extractAddress('shipping_', formData);

    await saveAddress(id, AddressType.BILLING, billingData);
    await saveAddress(id, AddressType.SHIPPING, shippingData);
    
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
    revalidatePath('/admin/affiliate');
    
    return { success: true, message: 'User profile updated successfully.' };
  } catch (error: unknown) {
    console.error('Update user failed:', error);
    return { success: false, message: 'Failed to update user profile.' };
  }
}

// ============================================================================
// 3. DELETE SINGLE USER
// ============================================================================
export async function deleteUser(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return { success: false, message: 'User ID is missing' };

  try {
    await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id },
          data: { isActive: false, deletedAt: new Date() }
        });
        
        // Ensure affiliate account is also deleted softly
        await tx.affiliateAccount.updateMany({
            where: { userId: id },
            data: { deletedAt: new Date(), status: "REJECTED" }
        });
    });
    
    revalidatePath('/admin/users');
    revalidatePath('/admin/affiliate');
    return { success: true, message: 'User moved to trash successfully.' };
  } catch (error: unknown) {
    console.error('Failed to move user to trash:', error);
    return { success: false, message: 'Failed to delete user.' };
  }
}

// ============================================================================
// 4. BULK ACTIONS: DELETE USERS
// ============================================================================
export async function bulkDeleteUsers(ids: string[]) {
  if (!ids || ids.length === 0) return { success: false, message: 'No users selected.' };

  try {
    await db.$transaction(async (tx) => {
        await tx.user.updateMany({
          where: { id: { in: ids } },
          data: { isActive: false, deletedAt: new Date() }
        });
        
        await tx.affiliateAccount.updateMany({
            where: { userId: { in: ids } },
            data: { deletedAt: new Date(), status: "REJECTED" }
        });
    });

    revalidatePath('/admin/users');
    revalidatePath('/admin/affiliate');
    return { success: true, message: `${ids.length} users deleted successfully.` };
  } catch (error: unknown) {
    console.error('Bulk delete failed:', error);
    return { success: false, message: 'Failed to delete selected users.' };
  }
}

// ============================================================================
// 5. BULK ACTIONS: CHANGE USER ROLE
// ============================================================================
export async function bulkChangeRole(ids: string[], newRole: Role) {
  if (!ids || ids.length === 0) return { success: false, message: 'No users selected.' };
  if (!newRole) return { success: false, message: 'Role is missing.' };

  try {
    await db.user.updateMany({
      where: { id: { in: ids } },
      data: { role: newRole }
    });

    // ✅ If changed to affiliate in bulk, create affiliate accounts
    if (newRole === 'AFFILIATE') {
        const users = await db.user.findMany({ where: { id: { in: ids } } });
        for (const user of users) {
            await ensureAffiliateAccount(user.id, newRole, user.name || "Customer");
        }
    }

    revalidatePath('/admin/users');
    revalidatePath('/admin/affiliate');
    return { success: true, message: `Changed role to ${newRole} for ${ids.length} users.` };
  } catch (error: unknown) {
    console.error('Bulk role change failed:', error);
    return { success: false, message: 'Failed to change roles.' };
  }
}

export async function sendPasswordReset(formData: FormData) {
  // Logic remains unchanged...
  const email = formData.get('email') as string;
  if (!email) return { success: false, message: 'Email is missing.' };

  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}&email=${email}`;

    await db.verificationToken.create({
      data: {
        identifier: email,
        token: resetToken,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24) 
      }
    });

    await sendNotification({
      trigger: "PASSWORD_RESET", 
      recipient: email,
      data: { 
        customer_name: user.name || "Customer",
        reset_link: resetLink 
      }
    });

    return { success: true, message: `Password reset link sent to ${email}` };
  } catch (error: unknown) {
    console.error('Password reset failed:', error);
    return { success: false, message: 'Failed to send reset link.' };
  }
}

// ============================================================================
// 7. RESET PASSWORD WITH TOKEN (from email link)
// ============================================================================
export async function resetPasswordWithToken(token: string, email: string, newPassword: string) {
  try {
    const verificationToken = await db.verificationToken.findFirst({
      where: {
        identifier: email,
        token: token,
        expires: { gt: new Date() },
      }
    });

    if (!verificationToken) {
      return { success: false, message: 'Invalid or expired reset link.' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { password: hashedPassword }
    });

    await db.verificationToken.delete({
      where: { identifier_token: { identifier: email, token: token } }
    });

    return { success: true, message: 'Password reset successfully.' };
  } catch (error: unknown) {
    console.error('Reset password with token failed:', error);
    return { success: false, message: 'Failed to reset password. Please try again.' };
  }
}