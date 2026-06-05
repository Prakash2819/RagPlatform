import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:llm_main_rag/core/api_service.dart';

class LoginProvider extends ChangeNotifier {
  bool isLoading = false;
  bool obscurePassword = true;

  String? userRole;
  String? token;
  String? userEmail;
  String? userName;
  String? tenantId;
  String? companyName;
  String? profileImage;

  void togglePassword() {
    obscurePassword = !obscurePassword;
    notifyListeners();
  }

  Future<bool> checkAutoLogin() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      token = prefs.getString("token");
      userRole = prefs.getString("role");
      userEmail = prefs.getString("email");
      userName = prefs.getString("name");
      tenantId = prefs.getString("tenant_id");
      companyName = prefs.getString("company_name");
      profileImage = prefs.getString("profile_image");

      if (token != null && token!.isNotEmpty) {
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint("AutoLogin Error: $e");
    }
    return false;
  }

  Future<void> logout() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.clear();
    } catch (e) {
      debugPrint("Logout Error: $e");
    }
    
    token = null;
    userRole = null;
    userEmail = null;
    userName = null;
    tenantId = null;
    companyName = null;
    profileImage = null;
    
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    isLoading = true;
    notifyListeners();

    try {
      final response = await ApiService.login(email, password);
      
      if (response["statusCode"] == 200) {
        final data = response["body"];
        token = data["token"] ?? "";
        
        final String rawRole = data["role"] ?? "member";
        if (rawRole == "superadmin") {
          userRole = "super_admin";
        } else if (rawRole == "admin") {
          userRole = "org_admin";
        } else {
          userRole = "org_user";
        }
        
        userEmail = data["email"] ?? email;
        userName = data["name"] ?? email.split('@')[0];
        tenantId = data["tenant_id"] ?? "";
        companyName = data["company_name"] ?? "";
        profileImage = data["profile_image"] ?? "";

        // Save to Shared Preferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString("token", token!);
        await prefs.setString("role", userRole!);
        await prefs.setString("email", userEmail!);
        await prefs.setString("name", userName!);
        await prefs.setString("tenant_id", tenantId!);
        await prefs.setString("company_name", companyName!);
        await prefs.setString("profile_image", profileImage!);

        isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint("Login error: $e");
    }

    isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> updateProfilePic(String base64OrUrl) async {
    if (token == null) return false;
    try {
      final response = await ApiService.updateProfileImage(token!, base64OrUrl);
      if (response["statusCode"] == 200) {
        profileImage = base64OrUrl;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString("profile_image", base64OrUrl);
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint("UpdateProfilePic error: $e");
    }
    return false;
  }

  Future<void> syncProfile() async {
    if (token == null) return;
    try {
      final response = await ApiService.fetchMe(token!);
      if (response["statusCode"] == 200) {
        final data = response["body"];
        userName = data["name"] ?? userName;
        userEmail = data["email"] ?? userEmail;
        profileImage = data["profile_image"] ?? profileImage;
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString("name", userName ?? "");
        await prefs.setString("email", userEmail ?? "");
        await prefs.setString("profile_image", profileImage ?? "");
        notifyListeners();
      }
    } catch (e) {
      debugPrint("SyncProfile error: $e");
    }
  }

  Future<bool> updateUserName(String newName) async {
    if (token == null) return false;
    try {
      final response = await ApiService.updateProfileName(token!, newName);
      if (response["statusCode"] == 200) {
        userName = newName;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString("name", newName);
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint("UpdateUserName error: $e");
    }
    return false;
  }
}
