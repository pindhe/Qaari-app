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
                                Text("maalmood").font(.caption)
                            }
                        }
                    }
                    Section {
                        Button("Ka bax", role: .destructive) { auth.logout() }
                    }
                } else {
                    Section {
                        Text("Marti ayaad tahay. Gal si aad u kaydsato kuwa aad jeceshahay oo aad u raacdo taxanaha maalinlaha ah.")
                        Button("Gal / Isdiiwaangeli") { auth.requireLogin() }
                    }
                }
                Section("Ku saabsan") {
                    Text("Wasaaradda Warfaafinta, Dhaqanka iyo Wacyigelinta · Jamhuuriyadda Somaliland")
                }
            }
            .navigationTitle("Akoonka")
        }
    }
}
