//app/actions/admin/warranty/claim-action.ts

'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ClaimStatus } from '@prisma/client';
import { sendNotification } from '@/app/api/email/send-notification';
import { logActivity } from '@/lib/activity-logger';

export async function updateClaimStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as ClaimStatus;
  if (!id || !status) return;

  try {
    const updatedClaim = await db.warrantyClaim.update({ 
      where: { id }, 
      data: { status } 
    });

    // 🛑 EMAIL TRIGGER: If status is APPROVED or REJECTED
    if (status === 'APPROVED') {
        await sendNotification({
            trigger: "WARRANTY_CLAIM_APPROVED",
            recipient: updatedClaim.email,
            data: { 
                customer_name: updatedClaim.name, 
                order_number: updatedClaim.orderNumber,
                replacement_part: updatedClaim.replacementPart || "your requested part"
            }
        });
    } else if (status === 'REJECTED') {
        await sendNotification({
            trigger: "WARRANTY_CLAIM_REJECTED",
            recipient: updatedClaim.email,
            data: { 
                customer_name: updatedClaim.name, 
                order_number: updatedClaim.orderNumber 
            }
        });
    }

    await logActivity({
      action: 'WARRANTY_STATUS_UPDATED',
      entityType: 'WarrantyClaim',
      entityId: id,
      details: { status, claimName: updatedClaim.name, orderNumber: updatedClaim.orderNumber },
    });

    revalidatePath(`/admin/warranty-claims`);
  } catch (error) {
    console.error('Update failed:', error);
  }
}

// Bulk update also sends emails individually
export async function bulkUpdateClaimStatus(ids: string[], status: ClaimStatus) {
  if (!ids.length || !status) return { success: false };
  try {
    const claims = await db.warrantyClaim.findMany({ where: { id: { in: ids } } });
    
    await db.warrantyClaim.updateMany({ where: { id: { in: ids } }, data: { status } });
    
    // 🛑 EMAIL TRIGGER for Bulk actions
    for (const claim of claims) {
        if (status === 'APPROVED') {
            await sendNotification({
                trigger: "WARRANTY_CLAIM_APPROVED",
                recipient: claim.email,
                data: { customer_name: claim.name, order_number: claim.orderNumber, replacement_part: claim.replacementPart || "your requested part" }
            });
        } else if (status === 'REJECTED') {
            await sendNotification({
                trigger: "WARRANTY_CLAIM_REJECTED",
                recipient: claim.email,
                data: { customer_name: claim.name, order_number: claim.orderNumber }
            });
        }
    }

    await logActivity({
      action: 'WARRANTY_BULK_STATUS_UPDATED',
      entityType: 'WarrantyClaim',
      details: { count: ids.length, status },
    });

    revalidatePath(`/admin/warranty-claims`);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function deleteClaimPermanently(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;
  try {
    await db.warrantyClaim.delete({ where: { id } });

    await logActivity({
      action: 'WARRANTY_DELETED',
      entityType: 'WarrantyClaim',
      entityId: id,
    });

    revalidatePath(`/admin/warranty-claims`);
  } catch (error) {
    console.error('Delete failed:', error);
  }
}

export async function bulkDeleteClaimsPermanently(ids: string[]) {
  if (!ids.length) return { success: false };
  try {
    await db.warrantyClaim.deleteMany({ where: { id: { in: ids } } });

    await logActivity({
      action: 'WARRANTY_BULK_DELETED',
      entityType: 'WarrantyClaim',
      details: { count: ids.length },
    });

    revalidatePath(`/admin/warranty-claims`);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}