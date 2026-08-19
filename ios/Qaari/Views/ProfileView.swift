import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var auth: AuthStore

    var body: some View {
        NavigationStack {
            List {
                if let user = auth.user, auth.isLoggedIn {
                    Section {
                        HStack {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(user.name).font(.title2.bold())
                                Text(user.email ?? user.phone ?? "")
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            VStack {
                                Text("\(user.streakCount)")
                                    .font(.largeTitle.bold())
                                    .foregroundStyle(Theme.gold)
                                Text("days").font(.caption)
                            }
                        }
                    }
                    Section {
                        Button("Sign out", role: .destructive) { auth.logout() }
                    }
                } else {
                    Section {
                        Text("You are browsing as a guest. Sign in to save favorites and keep a daily streak.")
                        Button("Sign in / Sign up") { auth.requireLogin() }
                    }
                }
                Section("About") {
                    Text("Ministry of Information, Culture and National Guidance · Republic of Somaliland")
                }
            }
            .navigationTitle("Account")
        }
    }
}
