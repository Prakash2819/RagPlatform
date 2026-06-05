import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:llm_main_rag/auth/providers/login_provider.dart';
import 'package:llm_main_rag/core/api_service.dart';

class DocumentModel {
  final String id;
  final String tenantId;
  final String filename;
  final String status;
  final String uploadedBy;
  final String uploadedAt;
  final int? chunksCreated;
  final int? totalChars;
  final String? error;

  DocumentModel({
    required this.id,
    required this.tenantId,
    required this.filename,
    required this.status,
    required this.uploadedBy,
    required this.uploadedAt,
    this.chunksCreated,
    this.totalChars,
    this.error,
  });

  factory DocumentModel.fromJson(Map<String, dynamic> json) {
    return DocumentModel(
      id: json['_id'] ?? '',
      tenantId: json['tenant_id'] ?? '',
      filename: json['filename'] ?? '',
      status: json['status'] ?? 'ready',
      uploadedBy: json['uploaded_by'] ?? '',
      uploadedAt: json['uploaded_at'] ?? '',
      chunksCreated: json['chunks_created'],
      totalChars: json['total_chars'],
      error: json['error'],
    );
  }

  String get formattedDate {
    try {
      final parsed = DateTime.tryParse(uploadedAt);
      if (parsed != null) {
        return DateFormat('MMM d, yyyy').format(parsed.toLocal());
      }
    } catch (_) {}
    return uploadedAt;
  }

  String get formattedDateTime {
    try {
      final parsed = DateTime.tryParse(uploadedAt);
      if (parsed != null) {
        return DateFormat('MMM d, yyyy hh:mm a').format(parsed.toLocal());
      }
    } catch (_) {}
    return uploadedAt;
  }

  String get formattedStatus {
    if (status.isEmpty) return 'Ready';
    return status[0].toUpperCase() + status.substring(1).toLowerCase();
  }
}

class DocumentScreen extends StatefulWidget {
  const DocumentScreen({super.key});

  @override
  State<DocumentScreen> createState() => _DocumentScreenState();
}

class _DocumentScreenState extends State<DocumentScreen> {
  final TextEditingController _searchController = TextEditingController();
  int _activeTab = 0; // 0 = Available Documents, 1 = Upload History

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final token = context.read<LoginProvider>().token;
      if (token != null) {
        context.read<UserDocumentProvider>().loadDocuments(token);
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<UserDocumentProvider>();
    final loginProvider = context.read<LoginProvider>();
    final bool isViewOnly = loginProvider.userRole == 'org_user';

    // Filter documents for active list (exclude failed in general documents, but keep in history log)
    List<DocumentModel> activeDocs = provider.searchQuery.isEmpty 
        ? provider.documents.where((doc) => doc.status != 'failed').toList()
        : provider.filteredDocuments.where((doc) => doc.status != 'failed').toList();

    List<DocumentModel> historyDocs = provider.documents;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: _buildAppBar(context),
      body: provider.isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF2D6CDF)))
          : Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),
                  _buildHeader(isViewOnly),
                  const SizedBox(height: 16),
                  _buildTabSelection(),
                  const SizedBox(height: 20),
                  if (_activeTab == 0) ...[
                    _buildSearchBar(provider),
                    const SizedBox(height: 16),
                    Expanded(
                      child: activeDocs.isEmpty 
                          ? _buildEmptyState("No active documents found.", Icons.folder_open_rounded) 
                          : _buildDocumentList(activeDocs, isViewOnly, provider),
                    ),
                  ] else ...[
                    Expanded(
                      child: historyDocs.isEmpty 
                          ? _buildEmptyState("No upload history logs recorded.", Icons.history_toggle_off_rounded) 
                          : _buildHistoryList(historyDocs),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87, size: 20),
        onPressed: () => context.pop(),
      ),
      title: const Text(
        "Intelligence Platform",
        style: TextStyle(color: Colors.black87, fontSize: 18, fontWeight: FontWeight.w600),
      ),
      centerTitle: false,
    );
  }

  Widget _buildHeader(bool isViewOnly) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Documents",
          style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.black87),
        ),
        const SizedBox(height: 4),
        Text(
          isViewOnly 
              ? "Access and search organization knowledge base documents (Read-Only)"
              : "Manage and upload files to power the organization's AI",
          style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
        ),
      ],
    );
  }

  Widget _buildTabSelection() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _activeTab = 0),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: _activeTab == 0 ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: _activeTab == 0
                      ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))]
                      : null,
                ),
                child: Center(
                  child: Text(
                    "Available Documents",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: _activeTab == 0 ? const Color(0xFF2D6CDF) : Colors.grey.shade600,
                    ),
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _activeTab = 1),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: _activeTab == 1 ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: _activeTab == 1
                      ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))]
                      : null,
                ),
                child: Center(
                  child: Text(
                    "Upload History Logs",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: _activeTab == 1 ? const Color(0xFF2D6CDF) : Colors.grey.shade600,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(UserDocumentProvider provider) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (value) => provider.searchDocuments(value),
        decoration: InputDecoration(
          hintText: "Search active documents...",
          hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
          prefixIcon: Icon(Icons.search_rounded, color: Colors.grey.shade400),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }

  Widget _buildEmptyState(String message, IconData icon) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 80, color: Colors.grey.shade200),
          const SizedBox(height: 16),
          Text(
            "No Records Found",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey.shade400),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: TextStyle(color: Colors.grey.shade400, fontSize: 14),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentList(List<DocumentModel> docs, bool isViewOnly, UserDocumentProvider provider) {
    return ListView.separated(
      itemCount: docs.length,
      padding: const EdgeInsets.only(bottom: 24, top: 8),
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final doc = docs[index];
        return _buildDocumentCard(doc, isViewOnly, () {
          // View-only user cannot delete, this button won't be visible or enabled.
        });
      },
    );
  }

  Widget _buildDocumentCard(DocumentModel doc, bool isViewOnly, VoidCallback onDelete) {
    final bool isPdf = doc.filename.toLowerCase().endsWith('.pdf');
    final Color iconColor = isPdf ? Colors.red.shade400 : Colors.blue.shade400;

    // Show characters or chunks as size metadata
    final String sizeInfo = doc.totalChars != null 
        ? "${doc.totalChars} chars"
        : (doc.chunksCreated != null ? "${doc.chunksCreated} chunks" : "Metadata pending");

    return Container(
      padding: const EdgeInsets.all(16),
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
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: iconColor.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(isPdf ? Icons.picture_as_pdf_rounded : Icons.description_rounded, color: iconColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  doc.filename,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(sizeInfo, style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                    const SizedBox(width: 8),
                    Container(width: 3, height: 3, decoration: BoxDecoration(color: Colors.grey.shade300, shape: BoxShape.circle)),
                    const SizedBox(width: 8),
                    Text(doc.formattedDate, style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
          _buildStatusBadge(doc.status),
        ],
      ),
    );
  }

  Widget _buildHistoryList(List<DocumentModel> docs) {
    return ListView.separated(
      itemCount: docs.length,
      padding: const EdgeInsets.only(bottom: 24, top: 8),
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final doc = docs[index];
        return _buildHistoryCard(doc);
      },
    );
  }

  Widget _buildHistoryCard(DocumentModel doc) {
    final bool isPdf = doc.filename.toLowerCase().endsWith('.pdf');
    final Color typeColor = isPdf ? Colors.red.shade400 : Colors.blue.shade400;

    Color stateColor;
    IconData stateIcon;
    switch (doc.status.toLowerCase()) {
      case 'ready':
        stateColor = Colors.green;
        stateIcon = Icons.check_circle_outline_rounded;
        break;
      case 'failed':
        stateColor = Colors.red;
        stateIcon = Icons.error_outline_rounded;
        break;
      default:
        stateColor = Colors.orange;
        stateIcon = Icons.hourglass_empty_rounded;
    }

    final String uploaderText = doc.uploadedBy.isNotEmpty 
        ? (doc.uploadedBy.length > 6 
            ? "Uploader ID: ...${doc.uploadedBy.substring(doc.uploadedBy.length - 6)}" 
            : "Uploader: ${doc.uploadedBy}")
        : "Uploader: Auto/System";

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.01),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Container(
          // border: Border(left: BorderSide(color: stateColor, width: 5)),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(isPdf ? Icons.picture_as_pdf_rounded : Icons.description_rounded, color: typeColor, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      doc.filename,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(stateIcon, color: stateColor, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        doc.formattedStatus,
                        style: TextStyle(color: stateColor, fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    uploaderText,
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 11, fontWeight: FontWeight.w500),
                  ),
                  Text(
                    doc.formattedDateTime,
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  if (doc.totalChars != null) ...[
                    Text("Chars: ${doc.totalChars}", style: TextStyle(color: Colors.grey.shade600, fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(width: 12),
                  ],
                  if (doc.chunksCreated != null) ...[
                    Text("Chunks: ${doc.chunksCreated}", style: TextStyle(color: Colors.grey.shade600, fontSize: 11, fontWeight: FontWeight.bold)),
                  ],
                ],
              ),
              if (doc.status.toLowerCase() == 'failed' && doc.error != null) ...[
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade100),
                  ),
                  child: Text(
                    "Reason: ${doc.error}",
                    style: TextStyle(color: Colors.red.shade800, fontSize: 11, height: 1.4),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    switch (status.toLowerCase()) {
      case 'ready':
        color = Colors.green;
        break;
      case 'failed':
        color = Colors.red;
        break;
      default:
        color = Colors.orange;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
      child: Text(
        status[0].toUpperCase() + status.substring(1).toLowerCase(),
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold),
      ),
    );
  }
}

class UserDocumentProvider extends ChangeNotifier {
  List<DocumentModel> documents = [];
  List<DocumentModel> filteredDocuments = [];
  List<dynamic> chatHistory = [];
  int totalQueries = 0;
  int activeChatsCount = 0;
  double averageResponseTime = 0.0;
  bool isLoading = false;
  bool isLoadingHistory = false;
  String searchQuery = "";

  Future<void> loadDocuments(String token) async {
    isLoading = true;
    notifyListeners();

    try {
      final response = await ApiService.fetchDocuments(token);
      if (response["statusCode"] == 200) {
        final List<dynamic> listData = response["body"]["documents"] ?? [];
        documents = listData.map((json) => DocumentModel.fromJson(json)).toList();
        
        // Sort documents by uploadedAt descending (newest first)
        documents.sort((a, b) => b.uploadedAt.compareTo(a.uploadedAt));
        
        searchDocuments(searchQuery);
      }
    } catch (e) {
      debugPrint("Load documents error: $e");
    }

    isLoading = false;
    notifyListeners();
  }

  Future<void> loadChatHistory(String token) async {
    isLoadingHistory = true;
    notifyListeners();

    try {
      final response = await ApiService.fetchChatHistory(token);
      if (response["statusCode"] == 200) {
        chatHistory = response["body"]["history"] ?? [];
        totalQueries = response["body"]["count"] ?? chatHistory.length;
        
        // Compute unique active chats (users)
        final uniqueUsers = chatHistory.map((item) => item["user_id"] ?? "").toSet();
        activeChatsCount = uniqueUsers.where((u) => u.isNotEmpty).length;
        if (activeChatsCount == 0 && chatHistory.isNotEmpty) {
          activeChatsCount = 1;
        }

        // Compute average response latency
        if (chatHistory.isNotEmpty) {
          int sum = chatHistory.fold(0, (prev, element) => prev + (element["response_time_ms"] as num? ?? 0).toInt());
          averageResponseTime = sum / chatHistory.length / 1000.0;
        } else {
          averageResponseTime = 0.0;
        }
      }
    } catch (e) {
      debugPrint("Load chat history error: $e");
    }

    isLoadingHistory = false;
    notifyListeners();
  }

  void searchDocuments(String query) {
    searchQuery = query;
    if (query.isEmpty) {
      filteredDocuments = documents;
    } else {
      filteredDocuments = documents
          .where((doc) => doc.filename.toLowerCase().contains(query.toLowerCase()))
          .toList();
    }
    notifyListeners();
  }
}
