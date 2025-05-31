import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addSampleData() {
  try {
    console.log('🏢 Adding sample properties, units, and leases...');

    // Get the first user to assign properties to
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;
    
    if (!users.users || users.users.length === 0) {
      console.log('❌ No users found. Please create a user account first.');
      return;
    }

    const userId = users.users[0].id;
    console.log(`👤 Using user: ${userId}`);

    // Add sample properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .insert([
        {
          user_id: userId,
          name: 'Sunset Apartments',
          address: '123 Main Street, Downtown',
          type: 'multi_unit',
          description: 'Modern apartment complex in the heart of downtown',
          beds: 2,
          baths: 2,
          size: 1200,
          year_built: 2018,
          market_rent: 950,
          deposit: 1400
        },
        {
          user_id: userId,
          name: 'Oak Grove Complex',
          address: '456 Oak Avenue, Midtown',
          type: 'multi_unit',
          description: 'Family-friendly complex with great amenities',
          beds: 3,
          baths: 2,
          size: 1400,
          year_built: 2015,
          market_rent: 1100,
          deposit: 1650
        },
        {
          user_id: userId,
          name: 'Pine Valley Residences',
          address: '789 Pine Street, Westside',
          type: 'single_unit',
          description: 'Luxury condos with mountain views',
          beds: 2,
          baths: 2,
          size: 1100,
          year_built: 2020,
          market_rent: 850,
          deposit: 1275
        },
        {
          user_id: userId,
          name: 'Riverside Towers',
          address: '321 River Road, Eastside',
          type: 'multi_unit',
          description: 'High-rise apartments with river views',
          beds: 1,
          baths: 1,
          size: 800,
          year_built: 2019,
          market_rent: 1200,
          deposit: 1800
        },
        {
          user_id: userId,
          name: 'Garden View Apartments',
          address: '654 Garden Lane, Southside',
          type: 'multi_unit',
          description: 'Cozy apartments with garden access',
          beds: 2,
          baths: 1,
          size: 950,
          year_built: 2016,
          market_rent: 700,
          deposit: 1050
        }
      ])
      .select();

    if (propertiesError) throw propertiesError;
    console.log(`✅ Added ${properties.length} properties`);

    // Add units for each property
    const unitsToAdd = [];
    properties.forEach((property, propIndex) => {
      const unitCount = [10, 15, 8, 20, 6][propIndex]; // Different unit counts per property
      const baseRent = [950, 1100, 850, 1200, 700][propIndex]; // Different rent amounts

      for (let i = 1; i <= unitCount; i++) {
        unitsToAdd.push({
          user_id: userId,
          property_id: property.id,
          name: `Unit ${propIndex + 1}${i.toString().padStart(2, '0')}`,
          unit_type: 'Apartment',
          beds: property.beds,
          baths: property.baths,
          size: Math.round(property.size + (Math.random() * 200 - 100)), // Slight variation
          market_rent: Math.round(baseRent + (Math.random() * 200 - 100)), // Slight rent variation
          deposit: Math.round((baseRent + (Math.random() * 200 - 100)) * 1.5), // 1.5x rent
          status: Math.random() > 0.1 ? 'occupied' : 'vacant' // 90% occupied
        });
      }
    });

    const { data: units, error: unitsError } = await supabase
      .from('units')
      .insert(unitsToAdd)
      .select();

    if (unitsError) throw unitsError;
    console.log(`✅ Added ${units.length} units`);

    // Add leases for occupied units
    const leasesToAdd = [];
    const occupiedUnits = units.filter(unit => unit.status === 'occupied');

    occupiedUnits.forEach((unit, index) => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12)); // Random start within last year

      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year lease

      leasesToAdd.push({
        unit_id: unit.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        rent_amount: unit.market_rent,
        notes: `Lease for ${unit.name} - Tenant ${index + 1}`
      });
    });

    const { data: leases, error: leasesError } = await supabase
      .from('leases')
      .insert(leasesToAdd)
      .select();

    if (leasesError) throw leasesError;
    console.log(`✅ Added ${leases.length} active leases`);

    console.log('\n🎉 Sample data added successfully!');
    console.log(`📊 Summary:`);
    console.log(`   Properties: ${properties.length}`);
    console.log(`   Units: ${units.length}`);
    console.log(`   Active Leases: ${leases.length}`);
    console.log(`   Occupancy Rate: ${((leases.length / units.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
}

addSampleData();
