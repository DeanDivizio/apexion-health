"use client";
import { useUser } from '@clerk/nextjs';
// this file is a rough draft
const { user } = useUser();

export async function setUnsafeMetadata(data: any) {
    if (!user) {
        throw new Error('No user found');
    }
    try {
        await user.update({
            unsafeMetadata: data,
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to set unsafe metadata:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

