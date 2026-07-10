/**
 * Firestore Code Submission Service
 * Manages CRUD operations for code submissions in the top-level codeSubmissions collection.
 * Follows the existing project pattern of top-level collections with userId field.
 */

import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
  limit,
} from 'firebase/firestore';
import type { CodeSubmission, CodeLanguage, SubmissionStatus } from '../types';

const COLLECTION = 'codeSubmissions';

/**
 * Save a new code submission.
 */
export async function saveSubmission(
  userId: string,
  submission: Omit<CodeSubmission, 'id' | 'userId' | 'createdAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...submission,
      userId,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION);
  }
}

/**
 * Fetch all submissions for a user, optionally filtered by questionId.
 */
export async function getSubmissions(
  userId: string,
  questionId?: string
): Promise<CodeSubmission[]> {
  try {
    const ref = collection(db, COLLECTION);
    const constraints = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50),
    ];

    if (questionId) {
      constraints.splice(1, 0, where('questionId', '==', questionId));
    }

    const q = query(ref, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId,
        questionId: data.questionId,
        language: data.language as CodeLanguage,
        sourceCode: data.sourceCode,
        output: data.output,
        status: data.status as SubmissionStatus,
        executionTime: data.executionTime,
        memory: data.memory,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt || new Date().toISOString(),
        score: data.score,
        passedPublic: data.passedPublic,
        totalPublic: data.totalPublic,
        passedHidden: data.passedHidden,
        totalHidden: data.totalHidden,
        aiFeedback: data.aiFeedback,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

/**
 * Delete a single submission.
 */
export async function deleteSubmission(
  userId: string,
  submissionId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, submissionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION}/${submissionId}`);
  }
}
