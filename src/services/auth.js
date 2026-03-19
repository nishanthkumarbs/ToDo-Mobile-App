import * as SecureStore from 'expo-secure-store';

export async function saveSession(token, user) {
  await SecureStore.setItemAsync('token', token);
  await SecureStore.setItemAsync('uid', String(user.id));
  await SecureStore.setItemAsync('uname', user.name || '');
  await SecureStore.setItemAsync('uemail', user.email || '');
  await SecureStore.setItemAsync('uavatar', user.avatar || '');
}

export async function getSessionUser() {
  const uid = await SecureStore.getItemAsync('uid');
  if (!uid) return null;
  
  return {
    id: Number(uid),
    name: await SecureStore.getItemAsync('uname') || '',
    email: await SecureStore.getItemAsync('uemail') || '',
    avatar: await SecureStore.getItemAsync('uavatar') || '',
  };
}

export async function clearSession() {
  await SecureStore.deleteItemAsync('token');
  await SecureStore.deleteItemAsync('uid');
  await SecureStore.deleteItemAsync('uname');
  await SecureStore.deleteItemAsync('uemail');
  await SecureStore.deleteItemAsync('uavatar');
}

export async function getToken() {
  return await SecureStore.getItemAsync('token');
}
