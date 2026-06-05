import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ApiService {
  static String get baseUrl {
    if (kIsWeb) {
      return "http://localhost:8000";
    } else if (Platform.isAndroid) {
      return "http://10.0.2.2:8000";
    } else {
      return "http://localhost:8000";
    }
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/auth/login"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "email": email,
          "password": password,
        }),
      );
      return {
        "statusCode": response.statusCode,
        "body": jsonDecode(response.body),
      };
    } catch (e) {
      return {
        "statusCode": 500,
        "body": {"message": "Network connection error: $e"},
      };
    }
  }

  static Future<Map<String, dynamic>> registerEmployee({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/auth/register/employee"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "name": name,
          "email": email,
          "password": password,
        }),
      );
      return {
        "statusCode": response.statusCode,
        "body": jsonDecode(response.body),
      };
    } catch (e) {
      return {
        "statusCode": 500,
        "body": {"message": "Network connection error: $e"},
      };
    }
  }

  static Future<Map<String, dynamic>> fetchDocuments(String token) async {
    try {
      final response = await http.get(
        Uri.parse("$baseUrl/documents/list"),
        headers: {
          "Authorization": "Bearer $token",
        },
      );
      return {
        "statusCode": response.statusCode,
        "body": jsonDecode(response.body),
      };
    } catch (e) {
      return {
        "statusCode": 500,
        "body": {"message": "Network connection error: $e"},
      };
    }
  }

  static Future<Map<String, dynamic>> fetchChatHistory(String token) async {
    try {
      final response = await http.get(
        Uri.parse("$baseUrl/chat/history"),
        headers: {
          "Authorization": "Bearer $token",
        },
      );
      return {
        "statusCode": response.statusCode,
        "body": jsonDecode(response.body),
      };
    } catch (e) {
      return {
        "statusCode": 500,
        "body": {"message": "Network connection error: $e"},
      };
    }
  }

  static Future<Map<String, dynamic>> askQuestion(
    String token,
    String question,
    List<Map<String, String>> chatHistory,
  ) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/chat/ask"),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          "question": question,
          "chat_history": chatHistory,
        }),
      );
      return {
        "statusCode": response.statusCode,
        "body": jsonDecode(response.body),
      };
    } catch (e) {
      return {
        "statusCode": 500,
        "body": {"message": "Network connection error: $e"},
      };
    }
  }

  static Future<Map<String, dynamic>> updateProfileImage(String token, String base64Image) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/auth/update-profile-image"),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          "profile_image": base64Image,
        }),
      );
      return {
        "statusCode": response.statusCode,
        "body": jsonDecode(response.body),
      };
    } catch (e) {
      return {
        "statusCode": 500,
        "body": {"message": "Network connection error: $e"},
      };
    }
  }

  static Future<Map<String, dynamic>> fetchMe(String token) async {
    try {
      final response = await http.get(
        Uri.parse("$baseUrl/auth/me"),
        headers: {
          "Authorization": "Bearer $token",
        },
      );
      return {
        "statusCode": response.statusCode,
        "body": jsonDecode(response.body),
      };
    } catch (e) {
      return {
        "statusCode": 500,
        "body": {"message": "Network connection error: $e"},
      };
    }
  }

  static Future<Map<String, dynamic>> updateProfileName(String token, String name) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/auth/update-profile"),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          "name": name,
        }),
      );
      return {
        "statusCode": response.statusCode,
        "body": jsonDecode(response.body),
      };
    } catch (e) {
      return {
        "statusCode": 500,
        "body": {"message": "Network connection error: $e"},
      };
    }
  }
}
