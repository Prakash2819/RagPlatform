import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:llm_main_rag/auth/login_page.dart';
import 'package:llm_main_rag/core/route_name.dart';
import 'package:llm_main_rag/auth/providers/login_provider.dart';
import 'package:provider/provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();

    /// ⏳ TIMER (2 seconds)
    Timer(const Duration(seconds: 2), () async {
      if (!mounted) return;
      final loginProvider = Provider.of<LoginProvider>(context, listen: false);
      bool isLoggedIn = await loginProvider.checkAutoLogin();
      
      if (!mounted) return;
      if (isLoggedIn) {
        switch (loginProvider.userRole) {
          case "super_admin":
            context.pushReplacement(RoutesPath.superadmin);
            break;
          case "org_admin":
            context.pushReplacement(RoutesPath.orgadminhome);
            break;
          case "org_user":
            context.pushReplacement(RoutesPath.home);
            break;
          default:
            context.pushReplacement(RoutesPath.login);
        }
      } else {
        context.pushReplacement(RoutesPath.login);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Image.asset("assets/images/Rag_Nova.png", height: 80),
      ),
    );
  }
}
