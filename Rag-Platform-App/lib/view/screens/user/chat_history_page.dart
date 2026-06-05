import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:llm_main_rag/auth/providers/login_provider.dart';
import 'package:llm_main_rag/core/api_service.dart';
import 'package:llm_main_rag/core/route_name.dart';


class ChatHistoryScreen extends StatefulWidget {
  const ChatHistoryScreen({super.key});

  @override
  State<ChatHistoryScreen> createState() => _ChatHistoryScreenState();
}

class _ChatHistoryScreenState extends State<ChatHistoryScreen> {
  @override
  Widget build(BuildContext context) {
    final token = context.read<LoginProvider>().token;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          "Chat History",
          style: TextStyle(color: Colors.black87, fontSize: 18, fontWeight: FontWeight.w600),
        ),
        centerTitle: false,
      ),
      body: token == null
          ? const Center(child: Text("Not authenticated"))
          : FutureBuilder<Map<String, dynamic>>(
              future: ApiService.fetchChatHistory(token),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator(color: Color(0xFF2D6CDF)));
                }
                if (snapshot.hasError || snapshot.data == null || snapshot.data!["statusCode"] != 200) {
                  return Center(
                    child: Text(
                      "Failed to load chat history.",
                      style: TextStyle(color: Colors.grey.shade400),
                    ),
                  );
                }

                final List<dynamic> history = snapshot.data!["body"]["history"] ?? [];
                if (history.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.history_toggle_off_rounded, size: 64, color: Colors.grey.shade200),
                        const SizedBox(height: 12),
                        Text(
                          "No query history found.",
                          style: TextStyle(color: Colors.grey.shade400),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  itemCount: history.length,
                  padding: const EdgeInsets.all(20),
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final item = history[index];
                    final question = item["question"] ?? "No question";
                    final dateStr = item["asked_at"] ?? "";
                    final parsed = DateTime.tryParse(dateStr);
                    final formattedDate = parsed != null 
                        ? DateFormat('MMM d, yyyy • hh:mm a').format(parsed.toLocal())
                        : dateStr;

                    return _buildHistoryCard(item, question, formattedDate);
                  },
                );
              },
            ),
    );
  }

  Widget _buildHistoryCard(Map<String, dynamic> item, String question, String dateStr) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            context.push(RoutesPath.chat, extra: item);
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.purple.shade50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.forum_outlined, color: Colors.purple.shade400, size: 22),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        question,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "By ${item['user_email'] ?? 'Member'} • $dateStr",
                        style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios_rounded, color: Colors.grey, size: 14),
              ],
            ),
          ),
        ),
      ),
    );
  }


}
