///<reference path="../../.d.ts"/>
"use strict";

import options = require("../options");
import hostInfo = require("../host-info");
import util = require("util");
import os = require("os");
import HostInfo = require("host-info");

export class PostInstallCommand implements ICommand {
	private static SEVEN_ZIP_ERROR_MESSAGE = "It looks like there's a problem with your system configuration. " +
		"You can find all system requirements on %s"; 

	constructor(private $fs: IFileSystem,
		private $staticConfig: Config.IStaticConfig,
		private $commandsService: ICommandsService,
		private $htmlHelpService: IHtmlHelpService,
		private $sysInfo: ISysInfo,
		private $logger: ILogger) {
	}

	public disableAnalytics = true;
	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if(process.platform !== "win32") {
				// when running under 'sudo' we create a working dir with wrong owner (root) and it is no longer accessible for the user initiating the installation
				// patch the owner here
				if (process.env.SUDO_USER) {
					this.$fs.setCurrentUserAsOwner(options.profileDir, process.env.SUDO_USER).wait();
				}
			}

			this.$htmlHelpService.generateHtmlPages().wait();

			let sysInfo = this.$sysInfo.getSysInfo();
			let isNativeScript = this.$staticConfig.CLIENT_NAME === "tns";
			if (isNativeScript) {
				this.printNSWarnings(sysInfo);
			} else {
				this.printAppBuilderWarnings(sysInfo);
			}

			this.$commandsService.tryExecuteCommand("autocomplete", []).wait();
		}).future<void>()();
	}

	private printPackageManagerTip() {
		if (hostInfo.isWindows()) {
			this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the chocolatey package manager to install the Android SDK and its dependencies." + os.EOL);
		} else if (hostInfo.isDarwin()) {
			this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the Homebrew package manager to install the Android SDK and its dependencies." + os.EOL);
		}
	}

	private printNSWarnings(sysInfo: ISysInfoData) {
		if (!sysInfo.adbVer) {
			this.$logger.warn("WARNING: adb from the Android SDK is not installed or is not configured properly.");
			this.$logger.out("For Android-related operations, the NativeScript CLI will use a built-in version of adb." + os.EOL
			+ "To avoid possible issues with the native Android emulator, Genymotion or connected" + os.EOL
			+ "Android devices, verify that you have installed the latest Android SDK and" + os.EOL
			+ "its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + os.EOL);

			this.printPackageManagerTip();
		}
		if (!sysInfo.antVer) {
			this.$logger.warn("WARNING: Apache Ant is not installed or is not configured properly.");
			this.$logger.out("You will not be able to build your projects for Android." + os.EOL
			+ "To be able to build for Android, download and install Apache Ant and" + os.EOL
			+ "its dependencies as described in http://ant.apache.org/manual/index.html" + os.EOL);

			this.printPackageManagerTip();
		}
		if (!sysInfo.androidInstalled) {
			this.$logger.warn("WARNING: The Android SDK is not installed or is not configured properly.");
			this.$logger.out("You will not be able to build your projects for Android and run them in the native emulator." + os.EOL
				+ "To be able to build for Android and run apps in the native emulator, verify that you have" + os.EOL
				+ "installed the latest Android SDK and its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + os.EOL
			);

			this.printPackageManagerTip();
		}
		if (hostInfo.isDarwin() && !sysInfo.xcodeVer) {
			this.$logger.warn("WARNING: Xcode is not installed or is not configured properly.");
			this.$logger.out("You will not be able to build your projects for iOS or run them in the iOS Simulator." + os.EOL
			+ "To be able to build for iOS and run apps in the native emulator, verify that you have installed Xcode." + os.EOL);
		}
		if (!sysInfo.itunesInstalled) {
			this.$logger.warn("WARNING: iTunes is not installed.");
			this.$logger.out("You will not be able to work with iOS devices via cable connection." + os.EOL
			+ "To be able to work with connected iOS devices," + os.EOL
			+ "download and install iTunes from http://www.apple.com" + os.EOL);
		}
		if(!sysInfo.javaVer) {
			this.$logger.warn("WARNING: The Java Development Kit (JDK) is not installed or is not configured properly.");
			this.$logger.out("You will not be able to work with the Android SDK and you might not be able" + os.EOL
				+ "to perform some Android-related operations. To ensure that you can develop and" + os.EOL
				+ "test your apps for Android, verify that you have installed the JDK as" + os.EOL
				+ "described in http://docs.oracle.com/javase/8/docs/technotes/guides/install/install_overview.html (for JDK 8)" + os.EOL
				+ "or http://docs.oracle.com/javase/7/docs/webnotes/install/ (for JDK 7)." + os.EOL);
		}
	}

	private printAppBuilderWarnings(sysInfo: ISysInfoData) {
		if (!sysInfo.adbVer) {
			this.$logger.warn("WARNING: adb from the Android SDK is not installed or is not configured properly. ");
			this.$logger.out("For Android-related operations, the AppBuilder CLI will use a built-in version of adb." + os.EOL
			+ "To avoid possible issues with the native Android emulator, Genymotion or connected" + os.EOL
			+ "Android devices, verify that you have installed the latest Android SDK and" + os.EOL
			+ "its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + os.EOL);

			this.printPackageManagerTip();
		}
		if (!sysInfo.androidInstalled) {
			this.$logger.warn("WARNING: The Android SDK is not installed or is not configured properly.");
			this.$logger.out("You will not be able to run your apps in the native emulator. To be able to run apps" + os.EOL
				+ "in the native Android emulator, verify that you have installed the latest Android SDK " + os.EOL
				+ "and its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + os.EOL
			);

			this.printPackageManagerTip()
		}
		if (!sysInfo.itunesInstalled) {
			this.$logger.warn("WARNING: iTunes is not installed.");
			this.$logger.out("You will not be able to work with iOS devices via cable connection." + os.EOL
			+ "To be able to work with connected iOS devices," + os.EOL
			+ "download and install iTunes from http://www.apple.com" + os.EOL);
		}
		if(!sysInfo.javaVer) {
			this.$logger.warn("WARNING: The Java Development Kit (JDK) is not installed or is not configured properly.");
			this.$logger.out("You will not be able to work with the Android SDK and you might not be able" + os.EOL
			+ "to perform some Android-related operations. To ensure that you can develop and" + os.EOL
			+ "test your apps for Android, verify that you have installed the JDK as" + os.EOL
			+ "described in http://docs.oracle.com/javase/8/docs/technotes/guides/install/install_overview.html (for JDK 8)" + os.EOL
			+ "or http://docs.oracle.com/javase/7/docs/webnotes/install/ (for JDK 7)." + os.EOL);
		}
	}
}
$injector.registerCommand("dev-post-install", PostInstallCommand);
