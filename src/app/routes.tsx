import { ComponentType, lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import HomePage from "../App";
import { TermsPage, PrivacyPage } from "./LegalPages";
import { getSavedActiveRoute, saveActiveRoute } from "./BrandLogo";
import {
  ADMIN_PORTAL_DOMAIN,
  STUDENT_PORTAL_DOMAIN,
  hydrateCrossDomainSession,
  isMasterAdminAuthenticated,
} from "./exnessStore";

function lazyComp<T extends Record<string, any>, K extends keyof T>(
  loader: () => Promise<T>,
  key: K
) {
  const LazyComponent = lazy(async () => {
    const mod = await loader();
    return { default: mod[key] as unknown as ComponentType<any> };
  });
  return function LazyPageWrapper(props: any) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#101216] flex items-center justify-center text-[#ffb600] font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-[#ffb600] animate-ping mr-2" />
            Loading Candlesticks Terminal...
          </div>
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

const loadPlatform = () => import("./PlatformPages");
const loadStudio = () => import("./AdminStudioPages");
const loadOnboarding = () => import("./OnboardingFlow");

const LoginPage = lazyComp(loadPlatform, "LoginPage");
const PortalLayout = lazyComp(loadPlatform, "PortalLayout");
const DashboardPage = lazyComp(loadPlatform, "DashboardPage");
const SettingsPage = lazyComp(loadPlatform, "SettingsPage");
const CoursesPage = lazyComp(loadPlatform, "CoursesPage");
const CourseDetailPage = lazyComp(loadPlatform, "CourseDetailPage");
const LessonPage = lazyComp(loadPlatform, "LessonPage");
const QuizPage = lazyComp(loadPlatform, "QuizPage");
const ProgressPage = lazyComp(loadPlatform, "ProgressPage");
const SessionSchedulePage = lazyComp(loadPlatform, "SessionSchedulePage");
const LiveRoomPage = lazyComp(loadPlatform, "LiveRoomPage");
const ReplayPage = lazyComp(loadPlatform, "ReplayPage");
const TradesPage = lazyComp(loadPlatform, "TradesPage");
const SignalFeedPage = lazyComp(loadPlatform, "SignalFeedPage");
const SignalDetailPage = lazyComp(loadPlatform, "SignalDetailPage");
const Mentorship1on1Page = lazyComp(loadPlatform, "Mentorship1on1Page");
const AccountManagementPage = lazyComp(loadPlatform, "AccountManagementPage");
const AdminDashboardPage = lazyComp(loadPlatform, "AdminDashboardPage");
const StudentRosterPage = lazyComp(loadPlatform, "StudentRosterPage");
const VerificationPage = lazyComp(loadPlatform, "VerificationPage");
const SignalFormPage = lazyComp(loadPlatform, "SignalFormPage");
const PaymentsPage = lazyComp(loadPlatform, "PaymentsPage");
const NotFoundPage = lazyComp(loadPlatform, "NotFoundPage");

const AdminCoursesPage = lazyComp(loadStudio, "AdminCoursesPage");
const AdminLiveSessionsPage = lazyComp(loadStudio, "AdminLiveSessionsPage");
const AdminMentorInboxPage = lazyComp(loadStudio, "AdminMentorInboxPage");

const OnboardingFlow = lazyComp(loadOnboarding, "OnboardingFlow");

// Hydrate cross-subdomain session (?ca_sso or .candlesticksacademy.online cookie) and route subdomain roots before createBrowserRouter initializes
if (typeof window !== "undefined") {
  document.title = "Candlesticks Academy";
  hydrateCrossDomainSession();

  const host = window.location.hostname.toLowerCase();
  const currentFull =
    window.location.pathname + window.location.search + window.location.hash;

  if ((host === ADMIN_PORTAL_DOMAIN || host.startsWith("master.")) && window.location.pathname === "/") {
    const dest = isMasterAdminAuthenticated() ? "/admin" : "/login";
    window.history.replaceState(null, "", dest);
  } else if (
    (host === STUDENT_PORTAL_DOMAIN || host.startsWith("student.") || host.startsWith("stu.")) &&
    window.location.pathname === "/"
  ) {
    const hasStudent = Boolean(localStorage.getItem("candlesticks_current_student"));
    const dest = hasStudent ? "/dashboard" : "/login";
    window.history.replaceState(null, "", dest);
  } else if (window.location.pathname === "/" && !window.location.search && !window.location.hash) {
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
      { path: "/mentorship", Component: Mentorship1on1Page },
      { path: "/account-management", Component: AccountManagementPage },
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
