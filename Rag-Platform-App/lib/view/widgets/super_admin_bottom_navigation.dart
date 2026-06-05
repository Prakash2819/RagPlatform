import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:llm_main_rag/core/route_name.dart';

class BottomNavBar extends StatelessWidget {
  final int currentIndex;

  const BottomNavBar({super.key, required this.currentIndex});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.8),
            spreadRadius: 1,
            blurRadius: 5,
          ),
        ],
      ),
      child: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: (i) {
          switch (i) {
            case 0:
              context.push(RoutesPath.superadmin);
              break;
            case 1:
              context.push(RoutesPath.tenants);
              break;
            case 2:
              context.push(RoutesPath.users);
              break;
            case 3:
              context.push(RoutesPath.superAdminProfileScreen);
              break;
          }
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.blue,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: "Dashboard",
          ),
          BottomNavigationBarItem(icon: Icon(Icons.business), label: "Tenants"),
          BottomNavigationBarItem(icon: Icon(Icons.people_alt), label: "User"),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: "Profile"),
        ],
      ),
    );
  }
}
