import 'dart:async';

import 'package:flutter/material.dart';
import 'package:llm_main_rag/LogoPage/logo_page.dart';
import 'package:llm_main_rag/core/routes.dart';
import 'package:llm_main_rag/auth/providers/login_provider.dart';
import 'package:llm_main_rag/auth/providers/register_provider.dart';
import 'package:llm_main_rag/view/screens/user/document_page.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(
    // const RagMind()
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LoginProvider()),
        ChangeNotifierProvider(create: (_) => RegisterProvider()),
         ChangeNotifierProvider(create: (_) => UserDocumentProvider()),
        ],
      child: const RagMind(),
    ),
  );
}

class RagMind extends StatefulWidget {
  const RagMind({super.key});

  @override
  State<RagMind> createState() => _RagMindState();
}

class _RagMindState extends State<RagMind> {
  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      routerConfig: route,
    );
  }
}
