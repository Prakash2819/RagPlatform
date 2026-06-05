import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:llm_main_rag/auth/providers/register_provider.dart';
import 'package:provider/provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final TextEditingController nameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController orgController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  bool isLoading = false;
  bool obscurePassword = true;

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

              const SizedBox(height: 20),

              /// TITLE
              const Text(
                "Create Account",
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.w700),
              ),

              const SizedBox(height: 10),

              const Text(
                "Enter your details to get started",
                style: TextStyle(color: Colors.black54),
              ),

              const SizedBox(height: 40),

              /// CARD
              Container(
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
                    /// NAME
                    buildLabel("FULL NAME"),
                    buildField(
                      controller: nameController,
                      icon: Icons.person_outline,
                      hint: "John Doe",
                    ),

                    const SizedBox(height: 16),

                    /// EMAIL
                    buildLabel("EMAIL ADDRESS"),
                    buildField(
                      controller: emailController,
                      icon: Icons.mail_outline,
                      hint: "alex@enterprise.com",
                    ),

                    const SizedBox(height: 16),

                    /// ORGANIZATION
                    buildLabel("ORGANIZATION"),
                    buildField(
                      controller: orgController,
                      icon: Icons.business_outlined,
                      hint: "Your Company",
                    ),

                    const SizedBox(height: 16),

                    /// PASSWORD
                    buildLabel("PASSWORD"),
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
                            .watch<RegisterProvider>()
                            .obscurePassword,
                        decoration: InputDecoration(
                          border: InputBorder.none,
                          icon: const Icon(Icons.lock_outline),
                          hintText: "••••••••",
                          suffixIcon: IconButton(
                            icon: Icon(
                              obscurePassword
                                  ? Icons.visibility_off
                                  : Icons.visibility,
                            ),
                            onPressed: () {
                              setState(() {
                                // obscurePassword = !obscurePassword;
                                context
                                    .read<RegisterProvider>()
                                    .togglePassword();
                              });
                            },
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    /// BUTTON
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2D6CDF),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        onPressed: context.watch<RegisterProvider>().isLoading
                            ? null
                            : () async {
                                final provider = context.read<RegisterProvider>();

                                bool success = await provider.register(
                                  name: nameController.text,
                                  email: emailController.text,
                                  org: orgController.text,
                                  password: passwordController.text,
                                );
                                if (!context.mounted) return;

                                if (success) {
                                  context.pop(context);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text("Register Success"),
                                      backgroundColor: Color(0xFF2D6CDF),
                                    ),
                                  );
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(provider.errorMessage ?? "Registration Failed"),
                                      backgroundColor: Colors.red.shade600,
                                    ),
                                  );
                                }
                              },
                        child: context.watch<RegisterProvider>().isLoading
                            ? const CircularProgressIndicator(
                                color: Colors.white,
                              )
                            : const Text(
                                "Create Account",
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              /// LOGIN LINK
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    "Already have an account?",
                    style: TextStyle(color: Colors.black54),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    child: const Text(
                      "Sign In",
                      style: TextStyle(color: Color(0xFF2D6CDF)),
                    ),
                  ),
                ],
              ),
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
