import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:llm_main_rag/core/route_name.dart';

class PasswordScreen extends StatefulWidget {
  const PasswordScreen({super.key});

  @override
  State<PasswordScreen> createState() => _PasswordScreenState();
}

class _PasswordScreenState extends State<PasswordScreen> {
  bool isPasswordVisible = false;
  bool isConfirmVisible = false;

  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmController = TextEditingController();

  bool has8Char = false;
  bool hasSymbol = false;
  bool hasNumber = false;
  bool hasUppercase = false;

  void validatePassword(String value) {
    setState(() {
      has8Char = value.length >= 8;
      hasSymbol = RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(value);
      hasNumber = RegExp(r'[0-9]').hasMatch(value);
      hasUppercase = RegExp(r'[A-Z]').hasMatch(value);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),

      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.blue),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Digital Architect",
          style: TextStyle(color: Colors.blue),
        ),
        centerTitle: false,
      ),

      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 20),

            /// CARD
            Padding(
              padding: const EdgeInsets.all(16),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    /// TITLE
                    const Text(
                      "Create New Password",
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),

                    const SizedBox(height: 8),

                    const Text(
                      "Your new password must be different\nfrom previous passwords.",
                      style: TextStyle(color: Colors.grey),
                    ),

                    const SizedBox(height: 20),

                    /// NEW PASSWORD
                    const Text(
                      "NEW PASSWORD",
                      style: TextStyle(fontSize: 12, letterSpacing: 1),
                    ),
                    const SizedBox(height: 8),

                    buildTextField(
                      hint: "Password",
                      isVisible: isPasswordVisible,
                      toggle: () {
                        setState(() {
                          isPasswordVisible = !isPasswordVisible;
                        });
                      },
                      controller: passwordController,
                      onChanged: validatePassword,
                    ),

                    const SizedBox(height: 16),

                    /// CONFIRM PASSWORD
                    const Text(
                      "CONFIRM NEW PASSWORD",
                      style: TextStyle(fontSize: 12, letterSpacing: 1),
                    ),
                    const SizedBox(height: 8),

                    buildTextField(
                      hint: "Confirm Password",
                      isVisible: isConfirmVisible,
                      toggle: () {
                        setState(() {
                          isConfirmVisible = !isConfirmVisible;
                        });
                      },
                      controller: confirmController,
                    ),

                    const SizedBox(height: 20),

                    /// REQUIREMENTS GRID
                    Row(
                      children: [
                        Expanded(
                          child: buildRequirement("8+ Characters", has8Char),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: buildRequirement("1 Symbol", hasSymbol),
                        ),
                      ],
                    ),

                    const SizedBox(height: 10),

                    Row(
                      children: [
                        Expanded(
                          child: buildRequirement("1 Number", hasNumber),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: buildRequirement("Uppercase", hasUppercase),
                        ),
                      ],
                    ),

                    const SizedBox(height: 25),

                    /// BUTTON
                    Container(
                      width: double.infinity,
                      height: 50,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        gradient: const LinearGradient(
                          colors: [Color(0xFF1E5BB8), Color(0xFF2E77D0)],
                        ),
                      ),
                      child: ElevatedButton(
                        onPressed: () {
                          // Handle password reset logic here
                          context.pushReplacement(RoutesPath.login);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          "Reset Password",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 15),

                    /// RETURN LOGIN
                    const Center(
                      child: Text(
                        "RETURN TO LOGIN",
                        style: TextStyle(
                          color: Colors.blue,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 40),

            /// FOOTER
            Column(
              children: const [
                Text(
                  "Digital Architect",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 10),
                Text(
                  "PRIVACY POLICY     TERMS OF SERVICE     HELP CENTER",
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 10),
                Text(
                  "© 2024 DIGITAL ARCHITECT. ALL RIGHTS RESERVED.",
                  style: TextStyle(fontSize: 11, color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
              ],
            ),

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget buildRequirement(String text, bool isValid) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF2F3F5),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(
            isValid ? Icons.check_circle : Icons.circle,
            size: 16,
            color: isValid ? Colors.blue : Colors.grey,
          ),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(
              fontSize: 13,
              color: isValid ? Colors.blue : Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  Widget buildTextField({
    required String hint,
    required bool isVisible,
    required VoidCallback toggle,
    required TextEditingController controller,
    Function(String)? onChanged,
  }) {
    return TextField(
      controller: controller,
      obscureText: !isVisible,
      onChanged: onChanged,
      decoration: InputDecoration(
        filled: true,
        fillColor: const Color(0xFFF2F3F5),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        suffixIcon: IconButton(icon: Icon(Icons.visibility), onPressed: toggle),
      ),
    );
  }
}
