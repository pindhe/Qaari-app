import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss
    @State private var isRegister = false
    @State private var name = ""
    @State private var identifier = ""
    @State private var password = ""
    @State private var error: String?
    @State private var loading = false

    var body: some View {
        NavigationStack {
            Form {
                if isRegister {
                    TextField("Name", text: $name)
                }
                TextField("Email or phone", text: $identifier)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                SecureField("Password", text: $password)
                if let error {
                    Text(error).foregroundStyle(Theme.red)
                }
                Button(isRegister ? "Sign up" : "Sign in") {
                    Task { await submit() }
                }
                .disabled(loading)
                Button(isRegister ? "Already have an account? Sign in" : "No account? Sign up") {
                    isRegister.toggle()
                }
            }
            .navigationTitle(isRegister ? "Sign up" : "Sign in")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    private func submit() async {
        loading = true
        error = nil
        do {
            if isRegister {
                try await auth.register(name: name, identifier: identifier, password: password)
            } else {
                try await auth.login(identifier: identifier, password: password)
            }
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}
