# כושר קרבי - Pre-Military Training App

A comprehensive Hebrew RTL web application for pre-military training in Gush Etzion.

## Firebase Setup

### 1. Firestore Database
Create a Firestore database and deploy the rules:
```bash
firebase deploy --only firestore:rules
```

### 2. Storage
Deploy the storage rules:
```bash
firebase deploy --only storage
```

### 3. Authentication
Enable Email/Password authentication in Firebase Console.

### 4. Admin Setup
To create the first admin user:
1. Register normally through the app
2. Go to Firestore Console
3. Find your user document in the `profiles` collection
4. Change the `role` field from "student" to "admin"

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

- **Firebase Admin**: Download service account key from Firebase Console and convert to base64
- **Mailjet**: For email notifications
- **Twilio**: For SMS notifications  
- **Stripe**: For payment processing
- **Google Maps**: For location features

## Development

```bash
npm install
npm run dev
```

## Features

- ✅ Hebrew RTL interface
- ✅ Firebase Authentication
- ✅ Event management
- ✅ User registration system
- ✅ QR code check-in
- ✅ Admin dashboard
- ✅ Email/SMS notifications
- ✅ Payment integration (Stripe)
- ✅ Media library
- ✅ Responsive design

## Security

The app uses Firebase Security Rules to ensure:
- Only published events are visible to public
- Users can only access their own data
- Admin role required for management functions
- Proper authentication for all sensitive operations