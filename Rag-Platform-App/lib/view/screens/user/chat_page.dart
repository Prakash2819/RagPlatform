import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:llm_main_rag/view/widgets/user_bottom_navigate.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:llm_main_rag/auth/providers/login_provider.dart';
import 'package:llm_main_rag/core/api_service.dart';
import 'package:llm_main_rag/core/route_name.dart';


class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
  });
}

class ChatScreen extends StatefulWidget {
  final Map<String, dynamic>? initialHistoryItem;
  const ChatScreen({super.key, this.initialHistoryItem});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> with TickerProviderStateMixin {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    _messages.add(
      ChatMessage(
        text: "Hello! I'm your Intelligence Architect. How can I help you analyze your data today?",
        isUser: false,
        timestamp: DateTime.now(),
      ),
    );

    if (widget.initialHistoryItem != null) {
      final question = widget.initialHistoryItem!["question"] ?? "";
      final answer = widget.initialHistoryItem!["answer"] ?? "";
      final dateStr = widget.initialHistoryItem!["asked_at"] ?? "";
      final parsedDate = DateTime.tryParse(dateStr) ?? DateTime.now();

      if (question.isNotEmpty) {
        _messages.add(
          ChatMessage(
            text: question,
            isUser: true,
            timestamp: parsedDate,
          ),
        );
      }
      if (answer.isNotEmpty) {
        _messages.add(
          ChatMessage(
            text: answer,
            isUser: false,
            timestamp: parsedDate,
          ),
        );
      }
      
      // Auto scroll to show populated content
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }



  void _sendMessage() {
    final String question = _messageController.text.trim();
    if (question.isEmpty) return;

    final token = context.read<LoginProvider>().token;
    if (token == null) return;

    final userMessage = ChatMessage(
      text: question,
      isUser: true,
      timestamp: DateTime.now(),
    );

    setState(() {
      _messages.add(userMessage);
      _messageController.clear();
      _isTyping = true;
    });

    _scrollToBottom();

    // Map message history to List[Message(role, content)] payload for API
    final List<Map<String, String>> historyPayload = [];
    for (int i = 0; i < _messages.length - 1; i++) {
      historyPayload.add({
        "role": _messages[i].isUser ? "user" : "assistant",
        "content": _messages[i].text,
      });
    }

    // Call actual backend ask API
    ApiService.askQuestion(token, question, historyPayload).then((response) {
      if (mounted) {
        setState(() {
          _isTyping = false;
          if (response["statusCode"] == 200) {
            final answer = response["body"]["answer"] ?? "";
            _messages.add(
              ChatMessage(
                text: answer,
                isUser: false,
                timestamp: DateTime.now(),
              ),
            );
          } else {
            _messages.add(
              ChatMessage(
                text: "Sorry, I had trouble connecting to the RAG engine. Please ensure you have uploaded documents first.",
                isUser: false,
                timestamp: DateTime.now(),
              ),
            );
          }
        });
        _scrollToBottom();
      }
    }).catchError((err) {
      if (mounted) {
        setState(() {
          _isTyping = false;
          _messages.add(
            ChatMessage(
              text: "Sorry, a connection error occurred. Please check your network.",
              isUser: false,
              timestamp: DateTime.now(),
            ),
          );
        });
        _scrollToBottom();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: _buildAppBar(context),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                return _buildMessageBubble(_messages[index]);
              },
            ),
          ),
          if (_isTyping) _buildTypingIndicator(),
          _buildSuggestedActions(),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildSuggestedActions() {
    final actions = ["Compare to Q3", "Export as PDF", "Visualise Trends"];
    return Container(
      height: 40,
      margin: const EdgeInsets.only(bottom: 8),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: actions.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          return GestureDetector(
            onTap: () {
              _messageController.text = actions[index];
              _sendMessage();
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.blue.shade100),
                boxShadow: [
                  BoxShadow(
                    color: Colors.blue.withOpacity(0.03),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Text(
                actions[index],
                style: TextStyle(
                  color: Colors.blue.shade700,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      leading: context.canPop()
          ? IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87, size: 20),
              onPressed: () => context.pop(),
            )
          : null,
      centerTitle: false,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "INTELLIGENCE ARCHITECT",
            style: TextStyle(
              color: Colors.blue.shade700,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          tooltip: "New Chat",
          icon: const Icon(Icons.add_comment_outlined, color: Colors.black87),
          onPressed: () {
            setState(() {
              _messages.clear();
              _messages.add(
                ChatMessage(
                  text: "Hello! I'm your Intelligence Architect. How can I help you analyze your data today?",
                  isUser: false,
                  timestamp: DateTime.now(),
                ),
              );
            });
            _scrollToBottom();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text("Started a new chat session"),
                duration: Duration(seconds: 1),
                backgroundColor: Color(0xFF2D6CDF),
              ),
            );
          },
        ),
        IconButton(
          tooltip: "History Details",
          icon: const Icon(Icons.history_rounded, color: Colors.black87),
          onPressed: () => context.push(RoutesPath.chatHistory),
        ),
        const SizedBox(width: 8),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Divider(height: 1, color: Colors.grey.shade200),
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message) {
    final bool isUser = message.isUser;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        child: Row(
          mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (!isUser) ...[
              CircleAvatar(
                radius: 14,
                backgroundColor: Colors.blue.shade50,
                child: Icon(Icons.auto_awesome, size: 14, color: Colors.blue.shade700),
              ),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: Column(
                crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: isUser ? const Color(0xFF2D6CDF) : Colors.white,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(20),
                        topRight: const Radius.circular(20),
                        bottomLeft: Radius.circular(isUser ? 20 : 4),
                        bottomRight: Radius.circular(isUser ? 4 : 20),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Text(
                      message.text,
                      style: TextStyle(
                        color: isUser ? Colors.white : Colors.black87,
                        fontSize: 15,
                        height: 1.4,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    DateFormat('hh:mm a').format(message.timestamp),
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 10),
                  ),
                ],
              ),
            ),
            if (isUser) const SizedBox(width: 32), // Add space to the right of user messages
          ],
        ),
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(left: 16, bottom: 16),
      child: Row(
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: Colors.blue.shade50,
            child: Icon(Icons.auto_awesome, size: 14, color: Colors.blue.shade700),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Text(
              "Thinking...",
              style: TextStyle(color: Colors.grey, fontSize: 13, fontStyle: FontStyle.italic),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: const Icon(Icons.add, color: Colors.grey),
              onPressed: () {},
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(24),
              ),
              child: TextFormField(
                controller: _messageController,
                decoration: const InputDecoration(
                  hintText: "Ask Intelligence...",
                  border: InputBorder.none,
                  hintStyle: TextStyle(color: Colors.grey, fontSize: 15),
                ),
                onFieldSubmitted: (_) => _sendMessage(),
              ),
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: _sendMessage,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(
                color: Color(0xFF2D6CDF),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }



  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
