import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:go_router/go_router.dart';
import 'package:llm_main_rag/core/route_name.dart';
import 'package:llm_main_rag/view/widgets/user_bottom_navigate.dart';
import 'package:provider/provider.dart';
import 'package:llm_main_rag/auth/providers/login_provider.dart';
import 'package:llm_main_rag/view/screens/user/document_page.dart';

class HomaScreen extends StatefulWidget {
  const HomaScreen({super.key});

  @override
  State<HomaScreen> createState() => _HomaScreenState();
}

class _HomaScreenState extends State<HomaScreen> {
  int currentIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final token = context.read<LoginProvider>().token;
      if (token != null) {
        context.read<UserDocumentProvider>().loadDocuments(token);
        context.read<UserDocumentProvider>().loadChatHistory(token);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: _buildAppBar(context),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 24),
              _buildQuickActions(),
              const SizedBox(height: 32),
              _buildAnalysisSection(),
              const SizedBox(height: 32),
              _buildRecentActivityHeader(),
              const SizedBox(height: 16),
              _buildActivityList(),
              const SizedBox(height: 32),
              _buildQuickInsight(),
              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const UserBottomNavBar(currentIndex: 0),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      automaticallyImplyLeading: false,
      backgroundColor: Colors.white,
      elevation: 0,
      title: Image.asset(
        "assets/images/Rag_Nova_title.png",
        height: 40,
        fit: BoxFit.contain,
      ),
      centerTitle: false,
      actions: [
        IconButton(
          onPressed: () {},
          icon: const Icon(Icons.notifications_none_rounded, color: Colors.black87),
        ),
        Padding(
          padding: const EdgeInsets.only(right: 16, left: 8),
          child: GestureDetector(
            onTap: () => context.push(RoutesPath.profile),
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.blue.shade100, width: 2),
              ),
              child: _buildHomeAvatar(context),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHomeAvatar(BuildContext context) {
    final loginProvider = Provider.of<LoginProvider>(context);
    final email = loginProvider.userEmail ?? "";
    final firstLetter = email.isNotEmpty ? email[0].toUpperCase() : "?";
    final profilePic = loginProvider.profileImage;

    ImageProvider? imageProvider;
    if (profilePic != null && profilePic.isNotEmpty) {
      if (profilePic.startsWith("http")) {
        imageProvider = NetworkImage(profilePic);
      } else {
        try {
          String cleanStr = profilePic;
          if (profilePic.contains("base64,")) {
            cleanStr = profilePic.split("base64,").last;
          }
          imageProvider = MemoryImage(base64Decode(cleanStr.trim()));
        } catch (e) {
          debugPrint("Error decoding base64 avatar on home: $e");
        }
      }
    }

    return CircleAvatar(
      radius: 16,
      backgroundColor: const Color(0xFF2D6CDF),
      backgroundImage: imageProvider,
      child: imageProvider == null
          ? Text(
              firstLetter,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            )
          : null,
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RichText(
          text: const TextSpan(
            children: [
              TextSpan(
                text: "Intelligence,\n",
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: Colors.black87,
                  height: 1.1,
                ),
              ),
              TextSpan(
                text: "Synthesized.",
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF2D6CDF),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Text(
          "Manage your RAG infrastructure and document analysis from one unified dashboard.",
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 14,
            height: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActions() {
    return Column(
      children: [
        _actionCard(
          icon: Icons.folder_shared_rounded,
          title: "View Organization Documents",
          subtitle: "Access secure knowledge resources",
          onTap: () => context.push(RoutesPath.documents),
          isPrimary: true,
        ),
        const SizedBox(height: 12),
        _actionCard(
          icon: Icons.chat_bubble_outline_rounded,
          title: "Start AI Chat",
          subtitle: "Query your knowledge base",
          onTap: () => context.push(RoutesPath.chat),
          isPrimary: false,
        ),
      ],
    );
  }

  Widget _buildAnalysisSection() {
    final provider = context.watch<UserDocumentProvider>();
    final docsCount = provider.documents.length;
    final queriesCount = provider.totalQueries;
    final activeChats = provider.activeChatsCount;
    final latencyText = provider.averageResponseTime > 0.0 
        ? "${provider.averageResponseTime.toStringAsFixed(1)}s"
        : "1.2s";

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "System Analysis",
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.3,
          children: [
            _analysisCard(
              "DOCUMENTS",
              "$docsCount",
              "Active",
              Icons.description_outlined,
              Colors.blue,
            ),
            _analysisCard(
              "AI QUERIES",
              "$queriesCount",
              "⚡ $latencyText",
              Icons.auto_awesome_outlined,
              Colors.purple,
            ),
            _analysisCard(
              "ACTIVE CHATS",
              "$activeChats",
              "Live",
              Icons.forum_outlined,
              Colors.green,
            ),
            _analysisCard(
              "RELIABILITY",
              "99.9%",
              "Stable",
              Icons.bolt_rounded,
              Colors.orange,
            ),
          ],
        ),
        const SizedBox(height: 20),
        _buildQuickAnalysisSummary(),
      ],
    );
  }

  Widget _analysisCard(String title, String value, String trend, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: color.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 20),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  trend,
                  style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              Text(
                title,
                style: TextStyle(
                  color: Colors.grey.shade500,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAnalysisSummary() {
    final provider = context.watch<UserDocumentProvider>();
    final latency = provider.averageResponseTime > 0.0 
        ? "${provider.averageResponseTime.toStringAsFixed(1)}s"
        : "1.2s";

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.shade100),
      ),
      child: Row(
        children: [
          Icon(Icons.insights_rounded, color: Colors.blue.shade700, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              "A total of ${provider.totalQueries} organization queries processed. Latency is optimal at $latency.",
              style: const TextStyle(fontSize: 13, color: Color(0xFF1E5BB8), fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentActivityHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Text(
          "Recent Activity",
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
        ),
        TextButton(
          onPressed: () => context.push(RoutesPath.documents),
          child: const Text("View All", style: TextStyle(color: Color(0xFF2D6CDF))),
        ),
      ],
    );
  }

  Widget _buildActivityList() {
    final provider = context.watch<UserDocumentProvider>();
    final recentDocs = provider.documents.take(3).toList();

    if (recentDocs.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade100),
        ),
        child: Center(
          child: Text(
            "No recent upload activity found.",
            style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
          ),
        ),
      );
    }

    return Column(
      children: recentDocs.map((doc) {
        IconData itemIcon;
        Color itemColor;
        switch (doc.status.toLowerCase()) {
          case 'ready':
            itemIcon = Icons.check_circle_outline_rounded;
            itemColor = Colors.green;
            break;
          case 'failed':
            itemIcon = Icons.error_outline_rounded;
            itemColor = Colors.red;
            break;
          default:
            itemIcon = Icons.hourglass_empty_rounded;
            itemColor = Colors.orange;
        }

        return _activityCard(
          icon: doc.filename.toLowerCase().endsWith('.pdf') 
              ? Icons.picture_as_pdf_rounded 
              : Icons.insert_drive_file_rounded,
          title: doc.filename,
          desc: "Status: ${doc.formattedStatus}${doc.chunksCreated != null ? ' (${doc.chunksCreated} chunks)' : ''}",
          time: doc.formattedDate,
        );
      }).toList(),
    );
  }

  Widget _buildQuickInsight() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Platform Insight",
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
        ),
        const SizedBox(height: 16),
        Container(
          height: 180,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            gradient: const LinearGradient(
              colors: [Color(0xFF2D6CDF), Color(0xFF1E5BB8)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.blue.withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Stack(
            children: [
              Positioned(
                right: -20,
                top: -20,
                child: Icon(Icons.auto_awesome, color: Colors.white.withOpacity(0.1), size: 150),
              ),
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: const [
                    Text(
                      "Vector Search v4.2",
                      style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    SizedBox(height: 8),
                    Text(
                      "Experience 40% faster indexing with our new parallel embedding engine.",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _actionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    required bool isPrimary,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isPrimary ? const Color(0xFF2D6CDF) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
          border: isPrimary ? null : Border.all(color: Colors.grey.shade200),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isPrimary ? Colors.white.withOpacity(0.2) : Colors.blue.shade50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: isPrimary ? Colors.white : const Color(0xFF2D6CDF)),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: isPrimary ? Colors.white : Colors.black87,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: isPrimary ? Colors.white70 : Colors.grey.shade500,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios_rounded,
              color: isPrimary ? Colors.white70 : Colors.grey.shade400,
              size: 14,
            ),
          ],
        ),
      ),
    );
  }

  Widget _activityCard({
    required IconData icon,
    required String title,
    required String desc,
    required String time,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: Colors.grey.shade600, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      time,
                      style: TextStyle(color: Colors.grey.shade400, fontSize: 10),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
