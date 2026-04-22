# Keep Razorpay & serialization
-keepattributes *Annotation*, InnerClasses
-dontnote proguard.configuration
-keep class com.razorpay.** { *; }
-keep class kotlinx.serialization.** { *; }
