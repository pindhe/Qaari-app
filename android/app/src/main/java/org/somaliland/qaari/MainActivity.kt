package org.somaliland.qaari

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import org.somaliland.qaari.ui.QaariApp
import org.somaliland.qaari.ui.QaariTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            QaariTheme {
                QaariApp()
            }
        }
    }
}
