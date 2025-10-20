# Firebase ID Token Authentication Implementation

## 🔐 **Secure Authentication Flow**

This implementation replaces the previous email-only authentication with a secure Firebase ID token-based system.

## 📋 **What Changed**

### **Backend Changes:**
1. **Firebase Admin SDK** - Added for server-side token verification
2. **New Auth Middleware** - `firebaseAuthMiddleware` verifies ID tokens
3. **Updated User Model** - Added `firebaseUid` field
4. **New Auth Endpoint** - `/api/user/firebase-auth` for secure authentication
5. **Enhanced Security** - HTTP-only cookies with longer expiration

### **Frontend Changes:**
1. **ID Token Retrieval** - Uses `user.getIdToken()` after Firebase login
2. **Authorization Header** - Sends token as `Bearer` token
3. **Updated User State** - Includes Firebase UID

## 🚀 **Authentication Flow**

### **1. User Login Process:**
```
Frontend → Firebase Auth → Get ID Token → Send to Backend → Verify Token → Set Cookie → Return User Data
```

### **2. Detailed Steps:**
1. **Frontend**: User clicks "Sign in with Google"
2. **Firebase**: Handles Google OAuth and returns user object
3. **Frontend**: Calls `user.getIdToken()` to get Firebase ID token
4. **Frontend**: Sends token in `Authorization: Bearer <token>` header
5. **Backend**: Verifies token with Firebase Admin SDK
6. **Backend**: Extracts UID, email, name from verified token
7. **Backend**: Checks if email is allowed in `Allowed` collection
8. **Backend**: Creates/updates user with Firebase UID
9. **Backend**: Sets HTTP-only session cookie
10. **Backend**: Returns user data to frontend

### **3. Subsequent Requests:**
- Frontend sends requests with session cookie
- Backend validates session cookie
- No need to send ID token on every request

## 🔧 **Setup Instructions**

### **1. Firebase Admin SDK Setup:**

#### **Option A: Environment Variables (Recommended)**
Add to your `.env` file:
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_ID=your-client-id
```

#### **Option B: Service Account JSON**
```bash
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
```

### **2. Get Firebase Service Account Key:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Extract the values for environment variables

### **3. Update Frontend Environment:**
Ensure your frontend has the correct Firebase config:
```javascript
// In your frontend .env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
// ... other Firebase config
```

## 🔒 **Security Features**

### **Token Verification:**
- ✅ Firebase Admin SDK verifies ID tokens server-side
- ✅ No trust in frontend-provided UID/email
- ✅ Automatic token expiration handling

### **Session Management:**
- ✅ HTTP-only cookies (not accessible via JavaScript)
- ✅ Secure flag in production
- ✅ SameSite protection
- ✅ 7-day expiration (configurable)

### **User Identification:**
- ✅ Firebase UID as primary identifier
- ✅ Email verification through Firebase
- ✅ Backward compatibility with existing users

## 📊 **API Endpoints**

### **New Endpoint:**
```
POST /api/user/firebase-auth
Headers: Authorization: Bearer <firebase-id-token>
Response: { success: true, user: { uid, email, name, isResuming } }
```

### **Legacy Endpoint (Deprecated):**
```
POST /api/user/google
Body: { email: "user@example.com" }
Response: { success: true, user: { email, name, isResuming } }
```

## 🧪 **Testing**

### **1. Test Authentication Flow:**
```bash
# Start backend
npm run dev

# Test with curl (replace with actual token)
curl -X POST http://localhost:8000/api/user/firebase-auth \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json"
```

### **2. Test Frontend:**
1. Open frontend in browser
2. Click "Sign in with Google"
3. Complete Google OAuth
4. Check browser network tab for successful `/firebase-auth` call
5. Verify user state is updated

## 🔄 **Migration Notes**

### **Existing Users:**
- Existing users without `firebaseUid` will be updated on first login
- No data loss during migration
- Backward compatibility maintained

### **Rollback Plan:**
- Legacy `/google` endpoint still available
- Can switch back by updating frontend to use old endpoint
- No database schema changes required for rollback

## 🚨 **Important Security Notes**

1. **Never expose Firebase service account key** in frontend code
2. **Use environment variables** for all sensitive configuration
3. **Rotate service account keys** regularly
4. **Monitor authentication logs** for suspicious activity
5. **Keep Firebase Admin SDK** updated

## 📝 **Environment Variables Reference**

```bash
# Required for Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_ID=your-client-id

# JWT Secret for session cookies
JWT_SECRET=your-super-secure-jwt-secret

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

## ✅ **Benefits of New System**

1. **Enhanced Security** - Server-side token verification
2. **Better User Experience** - Longer session duration
3. **Scalability** - Firebase handles authentication complexity
4. **Standards Compliance** - Uses industry-standard OAuth flow
5. **Future-Proof** - Easy to add other providers (Facebook, GitHub, etc.)
