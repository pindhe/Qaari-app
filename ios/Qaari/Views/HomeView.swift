import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var qaaris: [QaariSummary] = []
    @State private var error: String?
    @State private var loading = true

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    header
                    if let error { Text(error).foregroundStyle(Theme.red) }
                    if loading {
                        ProgressView()
                            .frame(maxWidth: .infinity, minHeight: 160)
                    }
                    LazyVStack(spacing: 12) {
                        ForEach(qaaris) { qaari in
                            NavigationLink(value: qaari.id) {
                                QaariRow(qaari: qaari)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding()
            }
            .background(Theme.cream.ignoresSafeArea())
            .navigationTitle("Qaari")
            .navigationDestination(for: String.self) { id in
                QaariProfileView(qaariId: id)
            }
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Wasaaradda Warfaafinta")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Theme.greenDark)
            Text("Dhageyso Qur'aanka kariimka ah")
                .font(.title2.weight(.bold))
            if let streak = auth.user?.streakCount, auth.isLoggedIn {
                Text("Taxane: \(streak) maalmood")
                    .font(.headline)
                    .foregroundStyle(Theme.gold)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }

    private func load() async {
        loading = qaaris.isEmpty
        do {
            struct Envelope: Codable { let qaaris: [QaariSummary] }
            let res: Envelope = try await APIClient.shared.get("/qaaris", token: auth.token)
            qaaris = res.qaaris
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}

struct QaariRow: View {
    let qaari: QaariSummary

    var body: some View {
        HStack(spacing: 14) {
            AsyncImage(url: qaari.photoUrl.flatMap(URL.init(string:))) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                ZStack {
                    Theme.green.opacity(0.12)
                    Text(String(qaari.name.prefix(1)))
                        .font(.title.weight(.bold))
                        .foregroundStyle(Theme.green)
                }
            }
            .frame(width: 64, height: 64)
            .clipShape(RoundedRectangle(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 4) {
                Text(qaari.name)
                    .font(.headline)
                    .foregroundStyle(Theme.ink)
                Text("\(qaari.uploadedJuzCount) Juz")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundStyle(.tertiary)
        }
        .padding(12)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}
