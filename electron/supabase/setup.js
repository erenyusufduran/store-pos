const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function setupTables() {
  try {
    console.log("Starting table setup...");

    // Create categories table first (since products reference it)
    console.log("Creating categories table...");
    const { error: categoriesError } = await supabase
      .from("categories")
      .select("*")
      .limit(1);

    if (categoriesError && categoriesError.code === "42P01") {
      console.log(
        "Categories table does not exist. Please create it in the Supabase dashboard with the following structure:"
      );
      console.log(`
        CREATE TABLE public.categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `);
    } else {
      console.log("Categories table exists");
    }

    // Create products table
    console.log("Creating products table...");
    const { error: productsError } = await supabase
      .from("products")
      .select("*")
      .limit(1);

    if (productsError && productsError.code === "42P01") {
      console.log(
        "Products table does not exist. Please create it in the Supabase dashboard with the following structure:"
      );
      console.log(`
        CREATE TABLE public.products (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          barcode TEXT UNIQUE,
          price DECIMAL(10,2) NOT NULL,
          category_id UUID REFERENCES public.categories(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          deleted_at TIMESTAMP WITH TIME ZONE
        );
      `);
    } else {
      console.log("Products table exists");
    }

    console.log(
      "\nSetup completed! Please create any missing tables in your Supabase dashboard using the SQL provided above."
    );
  } catch (error) {
    console.error("Error checking tables:", error);
    throw error;
  }
}

// Run the setup
setupTables().catch(console.error);
