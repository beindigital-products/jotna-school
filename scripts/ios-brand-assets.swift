import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

// Icône iOS (1024, sans alpha) et écran de lancement (2732), en Core Graphics
// pur : un contexte `noneSkipLast` donne un PNG RGB 24 bits sans canal alpha,
// ce que l'App Store exige pour une icône.
func loadImage(_ path: String) -> CGImage {
    let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil)!
    return CGImageSourceCreateImageAtIndex(src, 0, nil)!
}
func fit(_ img: CGImage, _ fitW: CGFloat, _ fitH: CGFloat, _ cx: CGFloat, _ cy: CGFloat) -> CGRect {
    let s = min(fitW / CGFloat(img.width), fitH / CGFloat(img.height))
    let w = CGFloat(img.width) * s, h = CGFloat(img.height) * s
    return CGRect(x: cx - w / 2, y: cy - h / 2, width: w, height: h)
}
func render(size: Int, path: String, body: (CGContext) -> Void) -> String {
    let space = CGColorSpace(name: CGColorSpace.sRGB)!
    let ctx = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
                        space: space, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
    ctx.interpolationQuality = .high
    // Dégradé sable (bas) → ciel (haut), comme l'en-tête de l'application.
    let colors = [CGColor(srgbRed: 0.965, green: 0.769, blue: 0.322, alpha: 1),
                  CGColor(srgbRed: 0.616, green: 0.863, blue: 0.984, alpha: 1)] as CFArray
    let grad = CGGradient(colorsSpace: space, colors: colors, locations: [0, 1])!
    ctx.drawLinearGradient(grad, start: CGPoint(x: 0, y: 0), end: CGPoint(x: 0, y: size), options: [])
    body(ctx)
    let out = ctx.makeImage()!
    let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: path) as CFURL, UTType.png.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(dest, out, nil)
    guard CGImageDestinationFinalize(dest) else { return "ECHEC ecriture \(path)" }
    let px = ctx.data!.assumingMemoryBound(to: UInt8.self)
    let off = (size / 2) * ctx.bytesPerRow + (size / 2) * 4
    return "\((path as NSString).lastPathComponent) centre rgb(\(px[off]),\(px[off+1]),\(px[off+2])) alpha:\(out.alphaInfo == .noneSkipLast ? "non" : "oui")"
}
let a = CommandLine.arguments
let logo = loadImage(a[1]), pio = loadImage(a[2])
print(render(size: 1024, path: a[3]) { c in c.draw(logo, in: fit(logo, 880, 880, 512, 512)) })
for p in a[4...] {
    print(render(size: 2732, path: p) { c in
        c.draw(pio, in: fit(pio, 1200, 1300, 1366, 1366 - 160))
        c.draw(logo, in: fit(logo, 1000, 640, 1366, 1366 + 720))
    })
}
