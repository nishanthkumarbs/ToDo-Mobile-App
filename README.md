# To Do - Mobile App

A premium, feature-rich Todo List application built with **React Native** and **Expo**. This app connects to a custom Spring Boot backend to provide persistent task management with advanced features like recurring tasks, custom reminders, and a monthly calendar view.

![App Icon](./assets/icon.png)

## 🚀 Features

-   **Authentication**: Secure login and registration with JWT tokens stored via `expo-secure-store`.
-   **Task Management**: Full CRUD operations for tasks with titles and priority levels.
-   **Advanced Recurring Tasks**: Set tasks to repeat **Daily**, **Weekly**, or **Monthly**. The app automatically spawns the next occurrence when the current one is completed.
-   **Smart Reminders**: In-app foreground alerts that notify you at a specific time (matches web app behavior).
-   **Calendar View**: A dedicated monthly calendar to browse tasks by their due dates.
-   **Sorting & Filtering**: Sort tasks by Due Date or Priority Rank; filter by All, Pending, or Completed status.
-   **Dark Mode**: Full system-wide dark mode support with a premium aesthetic.
-   **Native Experience**: Optimized for Android (APK) and iOS using Expo.

## 🛠️ Technology Stack

-   **Framework**: [React Native](https://reactnative.dev/) with [Expo SDK](https://expo.dev/)
-   **Navigation**: [React Navigation](https://reactnavigation.org/) (Stack & Bottom Tabs)
-   **State Management**: React Hooks (useState, useEffect, useCallback)
-   **API Client**: [Axios](https://axios-http.com/) with JWT interceptors
-   **Storage**: [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/secure-store/)
-   **UI Components**: [react-native-calendars](https://github.com/wix/react-native-calendars), Ionicons
-   **Backend**: Spring Boot REST API (Deployed on Render)

## 📲 Download the App

You can download the latest Android APK directly from the link below:

**[Download To Do APK (v1.0.2)](https://expo.dev/artifacts/eas/pBfbyWS2eiauGR8t6DsdJp.apk)**

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/nishanthkumarbs/ToDo-Mobile-App.git
   cd ToDo-Mobile-App
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npx expo start
   ```
   *Scan the QR code with the Expo Go app on your phone.*

## 🏗️ Building the App (APK)

The project is configured for **EAS Build**. To generate a standalone Android APK:

```bash
npx eas-cli build -p android --profile preview
```

## 🌐 Backend Reference

The app connects to the following production API:
`https://todo-backend-lldg.onrender.com/api`

---
*Created by [Nishanth Kumar](https://github.com/nishanthkumarbs)*
