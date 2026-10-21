import { createBrowserRouter } from "react-router";
import HomePage from "../App";
import { TermsPage, PrivacyPage } from "./LegalPages";
import {
  AdminDashboardPage,
  CourseDetailPage,
  CoursesPage,
  DashboardPage,
  LessonPage,
  LiveRoomPage,
  LoginPage,
  NotFoundPage,
  OnboardingPage,
  PaymentsPage,
  PortalLayout,
  ProgressPage,
  QuizPage,
  RegisterPage,
  ReplayPage,
  SessionSchedulePage,
  SettingsPage,
  SignalDetailPage,
  SignalFeedPage,
  SignalFormPage,
  StudentRosterPage,
  TradesPage,
  VerificationPage,
} from "./PlatformPages";
import { OnboardingFlow } from "./OnboardingFlow";
import {
  AdminCoursesPage,
  AdminLiveSessionsPage,
  AdminMentorInboxPage,
} from "./AdminStudioPages";
import { getSavedActiveRoute, saveActiveRoute } from "./BrandLogo";

// Restore active route on page/iframe refresh before createBrowserRouter initializes
if (typeof window !== "undefined") {
  const currentFull =
    window.location.pathname + window.location.search + window.location.hash;

  if (window.location.pathname === "/" && !window.location.search && !window.location.hash) {
    const savedRoute = getSavedActiveRoute();
    if (savedRoute && savedRoute !== "/" && savedRoute.startsWith("/")) {
      window.history.replaceState(null, "", savedRoute);
    }
  } else {
    saveActiveRoute(currentFull);
  }
}

export const router = createBrowserRouter([
  { path: "/", Component: HomePage },
  { path: "/terms", Component: TermsPage },
  { path: "/privacy", Component: PrivacyPage },
  { path: "/register", Component: OnboardingFlow },
  { path: "/login", Component: LoginPage },
  { path: "/onboarding", Component: OnboardingFlow },
  {
    Component: PortalLayout,
    children: [
      { path: "/dashboard", Component: DashboardPage },
      { path: "/settings", Component: SettingsPage },
      { path: "/courses", Component: CoursesPage },
      { path: "/courses/:courseId", Component: CourseDetailPage },
      { path: "/lessons/:lessonId", Component: LessonPage },
      { path: "/quiz/:quizId", Component: QuizPage },
      { path: "/progress", Component: ProgressPage },
      { path: "/sessions", Component: SessionSchedulePage },
      { path: "/sessions/live/:sessionId", Component: LiveRoomPage },
      { path: "/sessions/replay/:sessionId", Component: ReplayPage },
      { path: "/trades", Component: TradesPage },
      { path: "/signals", Component: SignalFeedPage },
      { path: "/signals/:signalId", Component: SignalDetailPage },
      { path: "/admin", Component: AdminDashboardPage },
      { path: "/admin/students", Component: StudentRosterPage },
      { path: "/admin/courses", Component: AdminCoursesPage },
      { path: "/admin/sessions", Component: AdminLiveSessionsPage },
      { path: "/admin/messages", Component: AdminMentorInboxPage },
      { path: "/admin/verification", Component: VerificationPage },
      { path: "/admin/signals/new", Component: SignalFormPage },
      { path: "/admin/payments", Component: PaymentsPage },
    ],
  },
  { path: "*", Component: NotFoundPage },
]);

if (typeof window !== "undefined") {
  router.subscribe((state) => {
    const fullPath =
      state.location.pathname + state.location.search + state.location.hash;
    saveActiveRoute(fullPath);
  });
}
