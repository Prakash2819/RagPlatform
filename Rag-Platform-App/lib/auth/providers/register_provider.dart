import 'package:flutter/material.dart';
import 'package:llm_main_rag/core/api_service.dart';

class RegisterProvider extends ChangeNotifier {
  bool isLoading = false;
  bool obscurePassword = true;
  String? errorMessage;

  void togglePassword() {
    obscurePassword = !obscurePassword;
    notifyListeners();
  }

  Future<bool> register({
    required String name,
    required String email,
    required String org,
    required String password,
  }) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.registerEmployee(
        name: name,
        email: email,
        password: password,
      );

      isLoading = false;
      notifyListeners();

      if (response["statusCode"] == 200) {
        return true;
      } else {
        errorMessage = response["body"]["detail"] ?? "Registration failed";
        return false;
      }
    } catch (e) {
      isLoading = false;
      errorMessage = "Connection error: $e";
      notifyListeners();
      return false;
    }
  }
}
