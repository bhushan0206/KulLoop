/** Optional Firestore mirror — off by default; server JSON store is canonical. */
export function isFirestoreMirrorEnabled(): boolean {
  return import.meta.env.VITE_FIRESTORE_MIRROR === 'true';
}

export async function mirrorSet(
  collectionName: string,
  id: string,
  data: object,
  merge = true
): Promise<void> {
  if (!isFirestoreMirrorEnabled()) return;
  try {
    const [{ doc, setDoc }, { getFirestoreDb, handleFirestoreError, OperationType }] = await Promise.all([
      import('firebase/firestore'),
      import('../services/firebase'),
    ]);
    const db = await getFirestoreDb();
    await setDoc(doc(db, collectionName, id), data, { merge });
  } catch (e) {
    const { handleFirestoreError, OperationType } = await import('../services/firebase');
    handleFirestoreError(e, OperationType.WRITE, `${collectionName}/${id}`);
  }
}

export async function mirrorDelete(collectionName: string, id: string): Promise<void> {
  if (!isFirestoreMirrorEnabled()) return;
  try {
    const [{ doc, deleteDoc }, { getFirestoreDb, handleFirestoreError, OperationType }] = await Promise.all([
      import('firebase/firestore'),
      import('../services/firebase'),
    ]);
    const db = await getFirestoreDb();
    await deleteDoc(doc(db, collectionName, id));
  } catch (e) {
    const { handleFirestoreError, OperationType } = await import('../services/firebase');
    handleFirestoreError(e, OperationType.DELETE, `${collectionName}/${id}`);
  }
}
