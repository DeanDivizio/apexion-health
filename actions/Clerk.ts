"use server";
import { clerkClient } from '@clerk/nextjs/server';

// this file is a rough draft

// unsafe should be used for macros
// this REPLACES the existing metadata
export async function setUnsafeMetadata(userId: string, data: any) {
    try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
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

// this ADDS to the existing metadata
export async function augmentUnsafeMetadata(userId: string, data: any) {
    try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        await client.users.updateUserMetadata(userId, {
            unsafeMetadata: {
                ...user.unsafeMetadata,
                ...data,
            },
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to augment unsafe metadata:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

// public should be used for prefs and markers
// this will add to the existing metadata
export async function setPublicMetadata(userId: string, data: any) {
    try {
        console.log('setPublicMetadata called with userId:', userId);
        const client = await clerkClient();
        console.log('Clerk client initialized');
        const result = await client.users.updateUserMetadata(userId, {
            publicMetadata: data,
        });
        console.log('Metadata update result:', result);
        return { success: true };
    } catch (error) {
        console.error('Failed to set public metadata:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}



