import SwiftUI

struct RootView: View {
    @EnvironmentObject private var auth: AuthStore

    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Guriga", systemImage: "house.fill") }
            SearchView()
                .tabItem { Label("Raadi", systemImage: "magnifyingglass") }
            FavoritesView()
                .tabItem { Label("Jecel", systemImage: "heart.fill") }
            ProfileView()
                .tabItem { Label("Akoon", systemImage: "person.fill") }
        }
        .sheet(isPresented: $auth.showLogin) {
            LoginView()
        }
        .safeAreaInset(edge: .bottom) {
            PlayerBar()
        }
    }
}
