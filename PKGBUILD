# Maintainer: Marten Tarkin <marten@tarkin.ee>
pkgname=url-saver
pkgver=2.0
pkgrel=1
epoch=
pkgdesc="WebExtension native app for saving URLs"
arch=('any')
url="https://github.com/Chronoes/url-saver"
license=('MIT')
groups=()
depends=('python>=3.7')
makedepends=()
checkdepends=()
optdepends=('firefox: uses this WebExtension native app')
provides=()
conflicts=()
replaces=()
backup=()
options=()
install=
changelog=
source=("$pkgname-$pkgver.tar.gz")
noextract=()
md5sums=('6b42d2922f677f8e66fa8d9c6e080718')
validpgpkeys=()

package() {
	cd "$srcdir"
    DEPLOY_PATH="$pkgdir/usr/local/share/$pkgname"
    mkdir -p "$DEPLOY_PATH"
    cp -r app/* "$DEPLOY_PATH"

    # Deploy to Firefox
    mkdir -p "$pkgdir/usr/lib/mozilla/native-messaging-hosts"
    cp app/url_saver.json "$pkgdir/usr/lib/mozilla/native-messaging-hosts"
}
