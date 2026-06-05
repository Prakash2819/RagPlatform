import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:llm_main_rag/core/route_name.dart';
import 'package:llm_main_rag/view/widgets/user_bottom_navigate.dart';
import 'package:provider/provider.dart';
import 'package:llm_main_rag/auth/providers/login_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late TextEditingController nameController;
  bool isEditingName = false;
  bool isDarkMode = false;
  bool isObscureCurrent = true;
  bool isObscureNew = true;

  @override
  void initState() {
    super.initState();
    final loginProvider = Provider.of<LoginProvider>(context, listen: false);
    nameController = TextEditingController(text: loginProvider.userName ?? "Alex Thompson");
    loginProvider.syncProfile();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: _buildAppBar(context),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildProfileHeader(),
            const SizedBox(height: 32),
            _buildSectionTitle("SECURITY"),
            _buildSecurityCard(),
            const SizedBox(height: 32),
            _buildSectionTitle("PREFERENCES"),
            _buildPreferencesCard(),
            const SizedBox(height: 40),
            _buildLogoutButton(),
            const SizedBox(height: 24),
            const Center(
              child: Text(
                "VERSION 2.4.0 (PREMIUM)",
                style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2),
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
      bottomNavigationBar: const UserBottomNavBar(currentIndex: 3),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      title: const Text(
        "Settings",
        style: TextStyle(color: Colors.black87, fontSize: 18, fontWeight: FontWeight.w600),
      ),
      centerTitle: false,
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Text(
        title,
        style: TextStyle(color: Colors.grey.shade500, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.5),
      ),
    );
  }

  void _updateName(String newName) async {
    if (newName.trim().isEmpty) return;
    final loginProvider = Provider.of<LoginProvider>(context, listen: false);
    final success = await loginProvider.updateUserName(newName.trim());
    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Name updated successfully!"),
            backgroundColor: Color(0xFF2D6CDF),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Failed to update name."),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _pickAndUploadImage(ImageSource source) async {
    try {
      final ImagePicker picker = ImagePicker();
      final XFile? image = await picker.pickImage(
        source: source,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 75,
      );

      if (image == null) return;

      final bytes = await image.readAsBytes();
      final String base64String = base64Encode(bytes);
      final String mimeType = image.name.endsWith('.png') ? 'image/png' : 'image/jpeg';
      final String dataUri = "data:$mimeType;base64,$base64String";

      _updateImage(dataUri);
    } catch (e) {
      debugPrint("Error picking image: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Error picking image: $e"),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showAvatarOptionsBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 16),
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                "Profile Picture Options",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.photo_library_rounded, color: Colors.blue.shade700),
                ),
                title: const Text("Choose from Gallery", style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(context);
                  _pickAndUploadImage(ImageSource.gallery);
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.purple.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.camera_alt_rounded, color: Colors.purple.shade700),
                ),
                title: const Text("Take a Photo", style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(context);
                  _pickAndUploadImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.link_rounded, color: Colors.amber.shade700),
                ),
                title: const Text("Preset Avatars & Custom URL", style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(context);
                  _showImageUpdateDialog();
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.delete_outline_rounded, color: Colors.red.shade700),
                ),
                title: const Text("Remove Photo (Default Initials)", style: TextStyle(color: Colors.red, fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(context);
                  _updateImage("");
                },
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  ImageProvider? _getProfileImageProvider(String? imageStr) {
    if (imageStr == null || imageStr.isEmpty) return null;
    if (imageStr.startsWith("http")) {
      return NetworkImage(imageStr);
    }
    try {
      String cleanStr = imageStr;
      if (imageStr.contains("base64,")) {
        cleanStr = imageStr.split("base64,").last;
      }
      return MemoryImage(base64Decode(cleanStr.trim()));
    } catch (e) {
      debugPrint("Error decoding base64 avatar: $e");
      return null;
    }
  }

  void _showImageUpdateDialog() {
    final loginProvider = Provider.of<LoginProvider>(context, listen: false);
    final urlController = TextEditingController(
      text: (loginProvider.profileImage?.startsWith("http") ?? false)
          ? loginProvider.profileImage
          : "",
    );

    final List<String> presets = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
    ];

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Text(
            "Update Profile Picture",
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Choose a preset avatar:",
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 60,
                  width: 300,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: presets.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final url = presets[index];
                      return GestureDetector(
                        onTap: () async {
                          Navigator.pop(context);
                          _updateImage(url);
                        },
                        child: CircleAvatar(
                          radius: 28,
                          backgroundImage: NetworkImage(url),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  "Or enter custom image URL:",
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: TextField(
                    controller: urlController,
                    decoration: const InputDecoration(
                      hintText: "https://example.com/avatar.jpg",
                      border: InputBorder.none,
                      hintStyle: TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text("Cancel", style: TextStyle(color: Colors.grey.shade600)),
            ),
            ElevatedButton(
              onPressed: () {
                final url = urlController.text.trim();
                Navigator.pop(context);
                if (url.isNotEmpty) {
                  _updateImage(url);
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2D6CDF),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text("Save"),
            ),
          ],
        );
      },
    );
  }

  void _updateImage(String imagePath) async {
    final loginProvider = Provider.of<LoginProvider>(context, listen: false);
    final success = await loginProvider.updateProfilePic(imagePath);
    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Profile image updated successfully!"),
            backgroundColor: Color(0xFF2D6CDF),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Failed to update profile image."),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Widget _buildProfileHeader() {
    final loginProvider = Provider.of<LoginProvider>(context);
    final email = loginProvider.userEmail ?? "alex.thompson@docmind.io";
    final firstLetter = email.isNotEmpty ? email[0].toUpperCase() : "?";
    final imageProvider = _getProfileImageProvider(loginProvider.profileImage);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          GestureDetector(
            onTap: _showAvatarOptionsBottomSheet,
            child: Stack(
              children: [
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.blue.shade100, width: 4),
                  ),
                  child: CircleAvatar(
                    radius: 50,
                    backgroundColor: const Color(0xFF2D6CDF),
                    backgroundImage: imageProvider,
                    child: imageProvider == null
                        ? Text(
                            firstLetter,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 40,
                              fontWeight: FontWeight.bold,
                            ),
                          )
                        : null,
                  ),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(color: Color(0xFF2D6CDF), shape: BoxShape.circle),
                    child: const Icon(Icons.camera_alt_rounded, size: 16, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          isEditingName
              ? SizedBox(
                  width: 200,
                  child: TextFormField(
                    controller: nameController,
                    autofocus: true,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87),
                    decoration: const InputDecoration(border: InputBorder.none, isDense: true),
                    onFieldSubmitted: (val) {
                      setState(() {
                        isEditingName = false;
                      });
                      _updateName(val);
                    },
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      loginProvider.userName ?? "Alex Thompson",
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () {
                        nameController.text = loginProvider.userName ?? "";
                        setState(() => isEditingName = true);
                      },
                      child: Icon(Icons.edit_note_rounded, size: 24, color: Colors.blue.shade700),
                    ),
                  ],
                ),
          const SizedBox(height: 4),
          Text(
            email,
            style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  (loginProvider.userRole ?? "org_user").replaceAll('_', ' ').toUpperCase(),
                  style: TextStyle(color: Colors.blue.shade700, fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 0.5),
                ),
              ),
              if (loginProvider.companyName != null && loginProvider.companyName!.isNotEmpty) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    loginProvider.companyName!.toUpperCase(),
                    style: TextStyle(color: Colors.grey.shade700, fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 0.5),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSecurityCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.shield_outlined, color: Colors.blue.shade700),
              const SizedBox(width: 12),
              const Text(
                "Password Security",
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
              ),
            ],
          ),
          const SizedBox(height: 24),
          _buildLabel("CURRENT PASSWORD"),
          const SizedBox(height: 8),
          _buildPasswordField(isObscureCurrent, () => setState(() => isObscureCurrent = !isObscureCurrent)),
          const SizedBox(height: 20),
          _buildLabel("NEW PASSWORD"),
          const SizedBox(height: 8),
          _buildPasswordField(isObscureNew, () => setState(() => isObscureNew = !isObscureNew)),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2D6CDF),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: const Text("Update Credentials", style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: TextStyle(color: Colors.grey.shade400, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1),
    );
  }

  Widget _buildPasswordField(bool obscure, VoidCallback onToggle) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: TextFormField(
        obscureText: obscure,
        decoration: InputDecoration(
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          suffixIcon: IconButton(
            icon: Icon(obscure ? Icons.visibility_off_rounded : Icons.visibility_rounded, color: Colors.grey.shade400, size: 20),
            onPressed: onToggle,
          ),
        ),
      ),
    );
  }

  Widget _buildPreferencesCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(12)),
            child: Icon(Icons.dark_mode_outlined, color: Colors.blue.shade700),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Dark Mode",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.black87),
                ),
                Text(
                  "Adjust interface appearance",
                  style: TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ],
            ),
          ),
          Switch.adaptive(
            value: isDarkMode,
            activeColor: const Color(0xFF2D6CDF),
            onChanged: (val) => setState(() => isDarkMode = val),
          ),
        ],
      ),
    );
  }

  Widget _buildLogoutButton() {
    return SizedBox(
      width: double.infinity,
      child: TextButton(
        onPressed: _showLogoutDialog,
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: Colors.red.shade100),
          ),
          backgroundColor: Colors.red.shade50.withOpacity(0.3),
        ),
        child: Text(
          "Logout from Device",
          style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.bold, fontSize: 15),
        ),
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text("Confirm Logout", style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text("Are you sure you want to log out of your session?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text("Cancel", style: TextStyle(color: Colors.grey.shade600)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await Provider.of<LoginProvider>(context, listen: false).logout();
              if (mounted) {
                context.pushReplacement(RoutesPath.login);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text("Logout"),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    nameController.dispose();
    super.dispose();
  }
}
