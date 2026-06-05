import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:llm_main_rag/core/route_name.dart';
import 'package:llm_main_rag/auth/providers/login_provider.dart';
import 'package:provider/provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  /// CONTROLLERS
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  bool isLoading = false;
  bool obscurePassword = true;

  /// EMAIL VALIDATION
  bool isValidEmail(String email) {
    return RegExp(r"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$").hasMatch(email);
  }

  /// LOGIN FUNCTION
  void login() async {
    String email = emailController.text.trim();
    String password = passwordController.text.trim();

    final provider = context.read<LoginProvider>();

    /// ✅ VALIDATION
    if (email.isEmpty) {
      showSnack("Enter email");
      return;
    }

    if (password.isEmpty) {
      showSnack("Enter password");
      return;
    }

    bool success = await provider.login(email, password);

    if (success) {
      showSnack("Login Successful");

      /// 🚀 NAVIGATION BASED ON ROLE
      switch (provider.userRole) {
        case "org_user":
          context.pushReplacement(RoutesPath.home);
          break;

        default:
          showSnack("Invalid role");
      }
    } else {
      showSnack("Login Failed");
    }
  }

  // void login() async {
  //   String email = emailController.text.trim();
  //   String password = passwordController.text.trim();

  //   /// ✅ VALIDATION
  //   if (email.isEmpty) {
  //     showSnack("Enter email");
  //     return;
  //   }

  //   if (password.isEmpty) {
  //     showSnack("Enter password");
  //     return;
  //   }

  //   setState(() => isLoading = true);

  //   try {
  //     /// ⏳ SIMULATE API CALL
  //     await Future.delayed(const Duration(seconds: 1));

  //     /// 🔥 GET USER ROLE
  //     String role = getUserRole(email);

  //     showSnack("Login successful");

  //     /// 🚀 NAVIGATION BASED ON ROLE
  //     if (role == "super_admin") {
  //       context.pushReplacement(RoutesPath.superAdminDashboard);
  //     } else if (role == "org_admin") {
  //       context.pushReplacement(RoutesPath.orgAdminDashboard);
  //     } else if (role == "org_user") {
  //       context.pushReplacement(RoutesPath.userDashboard);
  //     } else {
  //       showSnack("Invalid role");
  //     }
  //   } catch (e) {
  //     showSnack("Login failed");
  //   }

  //   setState(() => isLoading = false);
  // }

  // /// ================= ROLE LOGIC =================

  // String getUserRole(String email) {
  //   if (email == "superadmin@gmail.com") {
  //     return "super_admin";
  //   } else if (email.contains("admin")) {
  //     return "org_admin";
  //   } else {
  //     return "org_user";
  //   }
  // }

  /// ================= SNACKBAR =================
  void showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF2D6CDF),
        content: Text(
          message,
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
      ),
    );
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F8),

      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),

          child: Column(
            children: [
              const SizedBox(height: 40),

              /// LOGO
              Image.asset("assets/images/Rag_Nova_logo.png", height: 100),

              const SizedBox(height: 30),

              /// TITLE
              const Text(
                "Welcome back",
                style: TextStyle(fontSize: 34, fontWeight: FontWeight.w700),
              ),

              const SizedBox(height: 10),

              const Text(
                "Please enter your credentials to access the platform.",
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.black54),
              ),

              const SizedBox(height: 40),

              /// CARD
              Form(
                key: _formKey,
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),

                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      /// EMAIL
                      buildLabel("EMAIL ADDRESS"),
                      buildField(
                        controller: emailController,
                        icon: Icons.mail_outline,
                        hint: "architect@docmind.ai",
                      ),

                      const SizedBox(height: 20),

                      /// PASSWORD LABEL + FORGOT
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "PASSWORD",
                            style: TextStyle(
                              fontSize: 12,
                              letterSpacing: 1.2,
                              fontWeight: FontWeight.w600,
                              color: Colors.black54,
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              context.push(RoutesPath.resetPassword);
                            },
                            child: Text(
                              "Forgot Password?",
                              style: TextStyle(color: Color(0xFF2D6CDF)),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 10),

                      /// PASSWORD FIELD
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F3F5),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: TextFormField(
                          controller: passwordController,
                          // obscureText: obscurePassword,
                          obscureText: context
                              .watch<LoginProvider>()
                              .obscurePassword,
                          textAlignVertical: TextAlignVertical.center,
                          decoration: InputDecoration(
                            border: InputBorder.none,
                            icon: const Icon(Icons.lock_outline),
                            hintText: "••••••••",
                            suffixIcon: IconButton(
                              icon: Icon(
                                context.watch<LoginProvider>().obscurePassword
                                    ? Icons.visibility_off
                                    : Icons.visibility,
                              ),
                              onPressed: () {
                                setState(() {
                                  // obscurePassword = !obscurePassword;
                                  context
                                      .read<LoginProvider>()
                                      .togglePassword();
                                });
                              },
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 25),

                      /// LOGIN BUTTON
                      SizedBox(
                        width: double.infinity,
                        height: 55,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2D6CDF),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          // onPressed: isLoading ? null : login,
                          onPressed: context.watch<LoginProvider>().isLoading
                              ? null
                              : login,
                          child: context.watch<LoginProvider>().isLoading
                              ? const CircularProgressIndicator(
                                  color: Colors.white,
                                )
                              : const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      "Sign In",
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.white,
                                      ),
                                    ),
                                    SizedBox(width: 8),
                                    Icon(
                                      Icons.arrow_forward,
                                      color: Colors.white,
                                    ),
                                  ],
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 25),

              /// REGISTER LINK
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    "Don't have an account?",
                    style: TextStyle(color: Colors.black54),
                  ),
                  TextButton(
                    onPressed: () {
                      context.push(RoutesPath.register);
                    },
                    child: const Text(
                      "Register now",
                      style: TextStyle(color: Color(0xFF2D6CDF)),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              /// FOOTER
              // const Text(
              //   "© 2024 DIGITAL ARCHITECT",
              //   style: TextStyle(color: Colors.black54),
              // ),
            ],
          ),
        ),
      ),
    );
  }

  /// LABEL
  Widget buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 12,
          letterSpacing: 1.2,
          fontWeight: FontWeight.w600,
          color: Colors.black54,
        ),
      ),
    );
  }

  /// INPUT FIELD
  Widget buildField({
    required TextEditingController controller,
    required IconData icon,
    required String hint,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F3F5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: TextFormField(
        controller: controller,
        decoration: InputDecoration(
          border: InputBorder.none,
          icon: Icon(icon),
          hintText: hint,
        ),
      ),
    );
  }
}
