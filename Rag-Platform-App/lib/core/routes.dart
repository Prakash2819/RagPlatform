import 'package:go_router/go_router.dart';
import 'package:llm_main_rag/LogoPage/logo_page.dart';
import 'package:llm_main_rag/auth/login_page.dart';
import 'package:llm_main_rag/auth/otp_page.dart';
import 'package:llm_main_rag/auth/register_page.dart';
import 'package:llm_main_rag/auth/reset_password.dart';
import 'package:llm_main_rag/auth/reset_password_screen.dart';
import 'package:llm_main_rag/core/route_name.dart';
import 'package:llm_main_rag/view/screens/user/chat_page.dart';
import 'package:llm_main_rag/dashboard/home_page_user.dart';
import 'package:llm_main_rag/view/screens/user/document_page.dart';
import 'package:llm_main_rag/view/screens/user/profile_page.dart';
import 'package:llm_main_rag/view/screens/user/chat_history_page.dart';

final route = GoRouter(
  initialLocation: RoutesPath.splash,
  routes: [
    GoRoute(
      path: RoutesPath.splash,
      name: RoutesName.splash,
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: RoutesPath.login,
      name: RoutesName.login,
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: RoutesPath.register,
      name: RoutesName.register,
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: RoutesPath.home,
      name: RoutesName.home,
      builder: (context, state) => const HomaScreen(),
    ),
    GoRoute(
      path: RoutesPath.chat,
      name: RoutesName.chat,
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>?;
        return ChatScreen(initialHistoryItem: extra);
      },
    ),
    GoRoute(
      path: RoutesPath.documents,
      name: RoutesName.documents,
      builder: (context, state) => const DocumentScreen(),
    ),
    GoRoute(
      path: RoutesPath.profile,
      name: RoutesName.profile,
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: RoutesPath.resetPassword,
      name: RoutesName.resetPassword,
      builder: (context, state) => const ResetPassword(),
    ),
    GoRoute(
      path: RoutesPath.otp,
      name: RoutesName.otp,
      builder: (context, state) => const OTPScreen(),
    ),
     GoRoute(
      path: RoutesPath.passwordScreen,
      name: RoutesName.passwordScreen,
      builder: (context, state) => const PasswordScreen(),
    ),
    GoRoute(
      path: RoutesPath.chatHistory,
      name: RoutesName.chatHistory,
      builder: (context, state) => const ChatHistoryScreen(),
    ),
    
  ],
);
