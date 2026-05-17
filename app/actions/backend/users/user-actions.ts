// app/actions/admin/users/user-actions.ts

'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Role, AddressType } from '@prisma/client'; 
import { sendNotification } from '@/app/api/email/send-notification';

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
    country: (formData.get('country') as string) || 'AU', 
    phone: (formData.get(`${prefix}phone`) as string) || '',
    email: prefix === 'billing_' ? ((formData.get(`${prefix}email`) as string) || null) : null,
  };
};

// Helper function to safely save or update Address in Prisma
async function saveAddress(userId: string, type: AddressType, addressData: any) {
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
        data: {
          userId,
          type,
          ...addressData
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
  
  // 🛑 NEW: Extracting all the new fields
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

    // 🛑 NEW: Construct Metafields JSON
    const metafields = {
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      nickname: nickname?.trim() || name?.trim(),
      website: website?.trim()
    };

    const newUser = await db.user.create({
      data: {
        name: name?.trim() || nickname?.trim(),
        email: email.toLowerCase().trim(),
        role: role || 'CUSTOMER',
        password: password ? password : null, 
        notes: bio?.trim(), // Saved as Bio
        image: image || null, // Saved Profile Picture
        metafields: metafields, // Saved additional fields in JSON
        isActive: true
      }
    });

    // Extract and Save Addresses
    const billingData = extractAddress('billing_', formData);
    const shippingData = extractAddress('shipping_', formData);
    
    const countries = formData.getAll('country');
    const states = formData.getAll('state');
    
    billingData.country = (countries[0] as string) || 'AU';
    billingData.state = (states[0] as string) || '';
    
    shippingData.country = (countries[1] as string) || billingData.country;
    shippingData.state = (states[1] as string) || billingData.state;

    await saveAddress(newUser.id, AddressType.BILLING, billingData);
    await saveAddress(newUser.id, AddressType.SHIPPING, shippingData);
    
    revalidatePath('/admin/users');
    return { success: true, message: 'New user added successfully.' };
  } catch (error: any) {
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

  // 🛑 NEW: Extracting all the new fields
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

    // 🛑 NEW: Construct Metafields JSON (Keeping existing ones if any)
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

    const updateData: any = {
      name: name?.trim() || nickname?.trim(),
      email: email.toLowerCase().trim(),
      role: role,
      notes: bio?.trim(), // Updated Bio
      metafields: updatedMetafields // Updated JSON fields
    };

    // Update image only if it's provided or explicitly removed from frontend
    if (image !== undefined) {
      updateData.image = image || null;
    }

    if (password && password.trim() !== '') {
      updateData.password = password; 
    }

    await db.user.update({
      where: { id },
      data: updateData
    });

    // Extract and Save Addresses for existing user
    const billingData = extractAddress('billing_', formData);
    const shippingData = extractAddress('shipping_', formData);
    
    const countries = formData.getAll('country');
    const states = formData.getAll('state');
    
    billingData.country = (countries[0] as string) || 'AU';
    billingData.state = (states[0] as string) || '';
    
    shippingData.country = (countries[1] as string) || billingData.country;
    shippingData.state = (states[1] as string) || billingData.state;

    await saveAddress(id, AddressType.BILLING, billingData);
    await saveAddress(id, AddressType.SHIPPING, shippingData);
    
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
    
    return { success: true, message: 'User profile updated successfully.' };
  } catch (error: any) {
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
    await db.user.update({
      where: { id },
      data: { 
        isActive: false, 
        deletedAt: new Date() 
      }
    });
    
    revalidatePath('/admin/users');
    return { success: true, message: 'User moved to trash successfully.' };
  } catch (error: any) {
    console.error('User deletion failed:', error);
    return { success: false, message: 'Failed to delete user.' };
  }
}

// ============================================================================
// 4. BULK ACTIONS: DELETE USERS
// ============================================================================
export async function bulkDeleteUsers(ids: string[]) {
  if (!ids || ids.length === 0) return { success: false, message: 'No users selected.' };

  try {
    await db.user.updateMany({
      where: { id: { in: ids } },
      data: { 
        isActive: false, 
        deletedAt: new Date() 
      }
    });

    revalidatePath('/admin/users');
    return { success: true, message: `${ids.length} users deleted successfully.` };
  } catch (error: any) {
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

    revalidatePath('/admin/users');
    return { success: true, message: `Changed role to ${newRole} for ${ids.length} users.` };
  } catch (error: any) {
    console.error('Bulk role change failed:', error);
    return { success: false, message: 'Failed to change roles.' };
  }
}

// ============================================================================
// 6. SEND PASSWORD RESET EMAIL
// ============================================================================
export async function sendPasswordReset(formData: FormData) {
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
  } catch (error: any) {
    console.error('Password reset failed:', error);
    return { success: false, message: 'Failed to send reset link.' };
  }
}