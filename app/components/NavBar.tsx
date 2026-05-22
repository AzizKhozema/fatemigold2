export default function NavBar() {
    return (
        <nav className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 w-full  ">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        // onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                    >
                        {/* <Menu className="w-6 h-6 text-gray-600" /> */}
                    </button>   
                    <div>
                        <h1 className="text-gray-900">
                            {/* {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} */}
                            Jewelry Manager
                        </h1>
                        <p className="text-sm text-gray-500">
                            Welcome back! Heres whats happening today.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">AD</span>
                        </div>
                        <div className="hidden md:block">
                            <p className="text-sm text-gray-900">Admin User</p>
                            <p className="text-xs text-gray-500">   

                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}