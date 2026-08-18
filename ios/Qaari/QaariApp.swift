import SwiftUI

@main
struct QaariApp: App {
    @StateObject private var auth = AuthStore.shared
    @StateObject private var player = PlayerManager.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(auth)
                .environmentObject(player)
                .tint(Theme.green)
        }
    }
}
