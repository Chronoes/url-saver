# Maintainer: Marten Tarkin <marten@tarkin.ee>
pkgname=url-saver
pkgver=1.5
pkgrel=1
epoch=
pkgdesc="WebExtension native app for saving URLs"
arch=('any')
url="https://github.com/Chronoes/url-saver"
license=('MIT')
groups=()
depends=('python>=3.0')
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
md5sums=('47d0e6873e5d18e789f4787566c60e39')
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
