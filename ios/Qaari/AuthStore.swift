import Foundation
import Combine

@MainActor
final class AuthStore: ObservableObject {
    static let shared = AuthStore()

    @Published private(set) var token: String?
    @Published private(set) var user: UserProfile?
    @Published var showLogin = false

    var isLoggedIn: Bool { token != nil }

    private let tokenKey = "qaari.token"
    private let userKey = "qaari.user"

    init() {
        token = UserDefaults.standard.string(forKey: tokenKey)
        if let data = UserDefaults.standard.data(forKey: userKey) {
            user = try? JSONDecoder().decode(UserProfile.self, from: data)
        }
        Task { await refreshOnLaunch() }
    }

    func requireLogin() {
        showLogin = true
    }

    func login(identifier: String, password: String) async throws {
        let res: AuthResponse = try await APIClient.shared.send(
            "/auth/login",
            method: "POST",
            body: ["identifier": identifier, "password": password],
            token: nil
        )
        persist(res)
    }

    func register(name: String, identifier: String, password: String) async throws {
        var body: [String: Any] = ["name": name, "password": password]
        if identifier.contains("@") {
            body["email"] = identifier
        } else {
            body["phone"] = identifier
        }
        let res: AuthResponse = try await APIClient.shared.send(
            "/auth/register",
            method: "POST",
            body: body,
            token: nil
        )
        persist(res)
    }

    func logout() {
        token = nil
        user = nil
        UserDefaults.standard.removeObject(forKey: tokenKey)
        UserDefaults.standard.removeObject(forKey: userKey)
    }

    func refreshOnLaunch() async {
        guard let token else { return }
        do {
            struct Envelope: Codable { let user: UserProfile }
            let res: Envelope = try await APIClient.shared.send(
                "/auth/app-open",
                method: "POST",
                body: [:],
                token: token
            )
            user = res.user
            if let data = try? JSONEncoder().encode(res.user) {
                UserDefaults.standard.set(data, forKey: userKey)
            }
        } catch {
            // Keep cached profile if the network is down.
        }
    }

    private func persist(_ res: AuthResponse) {
        token = res.token
        user = res.user
        UserDefaults.standard.set(res.token, forKey: tokenKey)
        if let data = try? JSONEncoder().encode(res.user) {
            UserDefaults.standard.set(data, forKey: userKey)
        }
        showLogin = false
    }
}
