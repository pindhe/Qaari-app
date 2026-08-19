import SwiftUI

struct RootView: View {
    @EnvironmentObject private var auth: AuthStore

    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Home", systemImage: "house.fill") }
            SearchView()
                .tabItem { Label("Search", systemImage: "magnifyingglass") }
            FavoritesView()
                .tabItem { Label("Favorites", systemImage: "heart.fill") }
            ProfileView()
                .tabItem { Label("Account", systemImage: "person.fill") }
        }
        .sheet(isPresented: $auth.showLogin) {
            LoginView()
        }
        .safeAreaInset(edge: .bottom) {
            PlayerBar()
        }
    }
}
